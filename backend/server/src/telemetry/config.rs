//! Validated telemetry settings, independent of exporters and process globals.

use axum::http::Uri;
use std::net::Ipv6Addr;
use tracing_subscriber::filter::LevelFilter;

/// External logging policy; INFO intentionally includes DEBUG and TRACE events.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum LogLevel {
    /// Emit events at every severity.
    Info,
    /// Emit warning and error events.
    Warn,
    /// Emit only error events.
    Error,
}

impl LogLevel {
    /// Returns the event threshold, to be applied separately from span collection.
    pub fn event_filter(self) -> LevelFilter {
        match self {
            Self::Info => LevelFilter::TRACE,
            Self::Warn => LevelFilter::WARN,
            Self::Error => LevelFilter::ERROR,
        }
    }
}

/// Telemetry settings validated before any provider or sampling worker is created.
pub struct TelemetryConfig {
    /// Trimmed HTTP/HTTPS OTLP receiver URI, or local-only export when absent.
    pub endpoint: Option<String>,
    /// Validated event policy; layer filtering is integrated in phase 3.
    pub log_level: LogLevel,
}

/// Sanitized configuration errors that never retain user-supplied setting values.
#[derive(Debug, thiserror::Error, Eq, PartialEq)]
pub enum ConfigError {
    /// The configured receiver is not an absolute HTTP/HTTPS URI.
    #[error("OTEL_EXPORTER_OTLP_ENDPOINT must be a valid HTTP/HTTPS receiver URI")]
    InvalidEndpoint,
    /// The configured logging policy is not one of the supported external levels.
    #[error("LOG_LEVEL must be one of INFO, WARN, ERROR")]
    InvalidLogLevel,
}

impl TelemetryConfig {
    /// Reads each configuration input once at startup, rejecting non-Unicode values.
    pub fn from_env() -> Result<Self, ConfigError> {
        let endpoint = read_setting("OTEL_EXPORTER_OTLP_ENDPOINT", ConfigError::InvalidEndpoint)?;
        let log_level = read_setting("LOG_LEVEL", ConfigError::InvalidLogLevel)?;
        Self::parse(endpoint.as_deref(), log_level.as_deref())
    }

    /// Parses explicit inputs without reading the environment, connecting, or spawning work.
    /// Missing/blank endpoints disable remote export; only a missing level defaults to INFO.
    pub fn parse(endpoint: Option<&str>, log_level: Option<&str>) -> Result<Self, ConfigError> {
        let endpoint = endpoint.map(str::trim).filter(|value| !value.is_empty());
        if let Some(value) = endpoint {
            let uri = value
                .parse::<Uri>()
                .map_err(|_| ConfigError::InvalidEndpoint)?;
            let authority = uri.authority().ok_or(ConfigError::InvalidEndpoint)?;
            // Uri checks bracket syntax but not the address inside the brackets.
            if let Some(literal) = authority.host().strip_prefix('[') {
                literal
                    .strip_suffix(']')
                    .ok_or(ConfigError::InvalidEndpoint)?
                    .parse::<Ipv6Addr>()
                    .map_err(|_| ConfigError::InvalidEndpoint)?;
            }
            // Authority::port() returns None for both absent and invalid ports.
            // Ignore optional userinfo, then distinguish a bare host from host:port.
            let host_and_port = authority
                .as_str()
                .rsplit('@')
                .next()
                .ok_or(ConfigError::InvalidEndpoint)?;
            let has_port = host_and_port.len() > authority.host().len();
            if !matches!(uri.scheme_str(), Some("http" | "https"))
                || authority.host().is_empty()
                || (has_port && authority.port_u16().is_none())
                || value.contains('#')
            {
                return Err(ConfigError::InvalidEndpoint);
            }
        }
        let log_level = match log_level.map(str::trim) {
            None | Some("INFO") => LogLevel::Info,
            Some("WARN") => LogLevel::Warn,
            Some("ERROR") => LogLevel::Error,
            Some(_) => return Err(ConfigError::InvalidLogLevel),
        };
        Ok(Self {
            endpoint: endpoint.map(str::to_owned),
            log_level,
        })
    }
}

/// Reads an optional Unicode setting without including its contents in any error.
fn read_setting(name: &str, invalid: ConfigError) -> Result<Option<String>, ConfigError> {
    match std::env::var(name) {
        Ok(value) => Ok(Some(value)),
        Err(std::env::VarError::NotPresent) => Ok(None),
        Err(std::env::VarError::NotUnicode(_)) => Err(invalid),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tracing_subscriber::filter::LevelFilter;

    /// Missing settings select local export and the external INFO default.
    #[test]
    fn defaults_are_explicit() {
        let config = TelemetryConfig::parse(None, None).unwrap();
        assert_eq!(config.endpoint, None);
        assert_eq!(config.log_level, LogLevel::Info);
        assert_eq!(config.log_level.event_filter(), LevelFilter::TRACE);
    }

    /// Empty or whitespace-only endpoint settings disable remote export.
    #[test]
    fn blank_endpoints_disable_remote_export() {
        for endpoint in ["", " ", "\t\n"] {
            assert_eq!(
                TelemetryConfig::parse(Some(endpoint), None)
                    .unwrap()
                    .endpoint,
                None
            );
        }
    }

    /// HTTP/HTTPS receiver URIs are retained exactly after trimming.
    #[test]
    fn valid_endpoints_are_trimmed_and_retained() {
        for endpoint in [
            "http://localhost:4317",
            "https://collector.example:443/otlp",
            "http://127.0.0.1:4317",
            "http://[::1]:4317",
            "http://[::1]",
            "https://[2001:db8::1]:4317",
            "http://[::ffff:192.0.2.1]:4317",
        ] {
            let input = format!(" \t{endpoint}\n");
            assert_eq!(
                TelemetryConfig::parse(Some(&input), None).unwrap().endpoint,
                Some(endpoint.to_owned())
            );
        }
    }

    /// Nonempty invalid endpoints fail rather than silently selecting local export.
    #[test]
    fn malformed_endpoints_are_rejected() {
        for endpoint in [
            "not-a-url",
            "localhost:4317",
            "/collector",
            "ftp://collector:4317",
            "http://",
            "http://:4317",
            "http:///collector",
            "http://collector:invalid",
            "http://collector:65536",
            "http://collector with spaces:4317",
            "http://collector:4317/#fragment",
        ] {
            let error = TelemetryConfig::parse(Some(endpoint), None).err().unwrap();
            assert!(error.to_string().contains("OTEL_EXPORTER_OTLP_ENDPOINT"));
        }
    }

    /// Bracketed receiver hosts must contain a valid IPv6 address.
    #[test]
    fn invalid_bracketed_hosts_are_rejected() {
        for endpoint in [
            "http://[not-an-ip]:4317",
            "https://[not-an-ip]",
            "http://[127.0.0.1]:4317",
            "http://[2001:db8::gg]:4317",
            "http://[::1::]:4317",
        ] {
            assert!(
                matches!(
                    TelemetryConfig::parse(Some(endpoint), None),
                    Err(ConfigError::InvalidEndpoint)
                ),
                "invalid bracketed host was accepted: {endpoint}"
            );
        }
    }

    /// External INFO includes TRACE events; WARN and ERROR retain their thresholds.
    #[test]
    fn accepted_levels_map_to_event_thresholds() {
        for (input, expected, threshold) in [
            ("INFO", LogLevel::Info, LevelFilter::TRACE),
            ("WARN", LogLevel::Warn, LevelFilter::WARN),
            ("ERROR", LogLevel::Error, LevelFilter::ERROR),
        ] {
            for value in [input.to_owned(), format!(" \t{input}\n")] {
                let config = TelemetryConfig::parse(None, Some(&value)).unwrap();
                assert_eq!(config.log_level, expected);
                assert_eq!(config.log_level.event_filter(), threshold);
            }
        }
    }

    /// Only the three uppercase external levels are accepted, with no empty default.
    #[test]
    fn invalid_levels_list_the_allowed_values() {
        for level in [
            "DEBUG",
            "TRACE",
            "info",
            "warn",
            "error",
            "",
            " \t",
            "INF0",
            "server=info",
        ] {
            let error = TelemetryConfig::parse(None, Some(level)).err().unwrap();
            let message = error.to_string();
            for expected in ["LOG_LEVEL", "INFO", "WARN", "ERROR"] {
                assert!(message.contains(expected));
            }
        }
    }

    /// Both Display and Debug diagnostics omit user-supplied secrets.
    #[test]
    fn invalid_values_are_not_echoed_in_errors() {
        for (endpoint, level) in [
            (
                Some("ftp://user:PRIVATE_PASSWORD@collector/?token=PRIVATE_TOKEN"),
                None,
            ),
            (None, Some("PRIVATE_HEADER")),
        ] {
            let error = TelemetryConfig::parse(endpoint, level).err().unwrap();
            let diagnostics = format!("{error} {error:?}");
            assert!(!diagnostics.contains("PRIVATE_"));
            assert!(std::error::Error::source(&error).is_none());
        }
    }
}
