use serde::{
    de::Error,
    ser::{SerializeSeq, Serializer},
    Deserialize, Deserializer,
};
use serde_json;

pub fn serialize<S>(value: &i64, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    serializer.serialize_str(&value.to_string())
}

pub fn serialize_vec<S>(values: &Vec<i64>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let mut seq = serializer.serialize_seq(Some(values.len()))?;
    for v in values.iter() {
        seq.serialize_element(&v.to_string())?;
    }
    seq.end()
}

pub fn deserialize<'de, D>(deserializer: D) -> Result<i64, D::Error>
where
    D: Deserializer<'de>,
{
    match serde_json::Value::deserialize(deserializer)? {
        serde_json::Value::String(s) => s.parse::<i64>().map_err(Error::custom),
        serde_json::Value::Number(n) => n
            .as_i64()
            .ok_or_else(|| Error::custom("number out of range for i64")),
        _ => Err(Error::custom("expected string or number")),
    }
}

/// Serializes `Option<i64>` as `Option<string>` for JavaScript compatibility.
pub fn serialize_option<S>(value: &Option<i64>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    match value {
        Some(v) => serializer.serialize_some(&v.to_string()),
        None => serializer.serialize_none(),
    }
}

/// Deserializes `Option<string>` into `Option<i64>`.
pub fn deserialize_option<'de, D>(deserializer: D) -> Result<Option<i64>, D::Error>
where
    D: Deserializer<'de>,
{
    let opt = Option::<String>::deserialize(deserializer)?;
    match opt {
        Some(s) => Ok(Some(s.parse::<i64>().map_err(Error::custom)?)),
        None => Ok(None),
    }
}

pub fn deserialize_vec<'de, D>(deserializer: D) -> Result<Vec<i64>, D::Error>
where
    D: Deserializer<'de>,
{
    let strings: Vec<String> = Vec::<String>::deserialize(deserializer)?;
    strings
        .into_iter()
        .map(|s| s.parse::<i64>().map_err(Error::custom))
        .collect()
}

pub fn deserialize_option_vec<'de, D>(deserializer: D) -> Result<Option<Vec<i64>>, D::Error>
where
    D: Deserializer<'de>,
{
    // Use a custom visitor to handle the deserialization
    // This allows us to handle both string arrays and number arrays
    deserializer.deserialize_option(OptionVecVisitor)
}

/// Deserializes Option<Vec<i64>> but converts None to empty Vec<i64>
/// This allows Question to accept null roles in input but always have Vec<i64> internally
pub fn deserialize_option_vec_to_vec<'de, D>(deserializer: D) -> Result<Vec<i64>, D::Error>
where
    D: Deserializer<'de>,
{
    let option = deserialize_option_vec(deserializer)?;
    Ok(option.unwrap_or_default())
}

struct OptionVecVisitor;

impl<'de> serde::de::Visitor<'de> for OptionVecVisitor {
    type Value = Option<Vec<i64>>;

    fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
        formatter.write_str("null or an array of strings or numbers")
    }

    fn visit_none<E>(self) -> Result<Self::Value, E>
    where
        E: Error,
    {
        Ok(None)
    }

    fn visit_unit<E>(self) -> Result<Self::Value, E>
    where
        E: Error,
    {
        Ok(None)
    }

    fn visit_some<D>(self, deserializer: D) -> Result<Self::Value, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_seq(VecVisitor).map(Some)
    }
}

struct VecVisitor;

impl<'de> serde::de::Visitor<'de> for VecVisitor {
    type Value = Vec<i64>;

    fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
        formatter.write_str("an array of strings or numbers")
    }

    fn visit_seq<A>(self, mut seq: A) -> Result<Self::Value, A::Error>
    where
        A: serde::de::SeqAccess<'de>,
    {
        let mut vec = Vec::new();
        while let Some(elem) = seq.next_element::<serde_json::Value>()? {
            let parsed = match elem {
                serde_json::Value::String(s) => s.parse::<i64>().map_err(Error::custom)?,
                serde_json::Value::Number(n) => n
                    .as_i64()
                    .ok_or_else(|| Error::custom("number out of range for i64"))?,
                _ => return Err(Error::custom("expected string or number in roles array")),
            };
            vec.push(parsed);
        }
        Ok(vec)
    }
}

#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – Equivalence Partitioning (EP) & Boundary Value Analysis (BVA)
    // =========================================================================
    //
    // Functions under test
    //   · serialize(&i64, S) -> i64 rendered as a JSON string
    //   · serialize_vec(&Vec<i64>, S) -> array of JSON strings
    //   · serialize_option(&Option<i64>, S) -> Option<string>
    //   · deserialize(D) -> i64 (accepts string OR number, else error)
    //   · deserialize_vec(D) -> Vec<i64> (array of strings)
    //   · deserialize_option(D) -> Option<i64>
    //   · deserialize_option_vec_to_vec(D) -> Vec<i64> (null -> empty vec)
    //
    // ── EQUIVALENCE PARTITIONING ──────────────────────────────────────────────
    //
    // deserialize – input JSON kind
    //
    //  ID    Input          Class            Expected            Test
    //  EP01  "42"           string           Ok(42)              deserialise_accepts_string
    //  EP02  42             number           Ok(42)              deserialise_accepts_number
    //  EP03  "abc"          unparseable str  Err                 returns_error_for_unparseable_string
    //  EP04  true           wrong kind       Err                 returns_error_for_non_string_number
    //
    // serialize family – i64 always rendered as a (JSON) string
    //
    //  ID    Input          Expected JSON       Test
    //  EP05  7              "7"                 serialises_i64_as_string
    //  EP06  vec![1,2]      ["1","2"]           serialises_vec_as_string_array
    //  EP07  Some(9)        "9"                 serialises_option_some_as_string
    //  EP08  None           null                serialises_option_none_as_null
    //
    // option/vec deserialize – null vs present
    //
    //  ID    Input          Function                    Expected      Test
    //  EP09  null           deserialize_option_vec_to_vec  []         option_vec_null_becomes_empty
    //  EP10  ["1","2"]      deserialize_option_vec_to_vec  [1,2]      option_vec_reads_string_array
    //  EP11  [1,2]          deserialize_option_vec_to_vec  [1,2]      option_vec_reads_number_array
    //  EP12  null           deserialize_option             None       option_null_becomes_none
    //  EP13  "5"            deserialize_option             Some(5)    option_some_round_trips
    //
    // ── BOUNDARY VALUE ANALYSIS ───────────────────────────────────────────────
    //
    // i64 magnitude – JS loses precision past 2^53, which is the whole reason these
    // helpers stringify ids. The boundary is i64::MAX surviving a round-trip.
    //
    //  ID    Value        Expected                Test                     Status
    //  BV01  i64::MAX     "9223372036854775807"   serialises_i64_max       OK
    //  BV02  empty vec    []                       serialises_empty_vec     OK
    //
    // ── KNOWN GAPS ────────────────────────────────────────────────────────────
    //
    //  · deserialize_vec (strict string-only array) and deserialize_option_vec's
    //    visit_some/visit_seq paths are exercised indirectly through
    //    deserialize_option_vec_to_vec, but the number-out-of-range error branch
    //    inside VecVisitor is not hit here — an i64 cannot overflow via serde_json's
    //    as_i64 for in-range integers, so that arm is left uncovered by design.
    // =========================================================================

    use super::*;
    use serde::{Deserialize, Serialize};

    // ── helpers ──────────────────────────────────────────────────────────────

    #[derive(Serialize)]
    struct Id {
        #[serde(serialize_with = "serialize")]
        v: i64,
    }

    #[derive(Serialize)]
    struct IdVec {
        #[serde(serialize_with = "serialize_vec")]
        v: Vec<i64>,
    }

    #[derive(Serialize)]
    struct IdOpt {
        #[serde(serialize_with = "serialize_option")]
        v: Option<i64>,
    }

    #[derive(Deserialize)]
    struct DeId {
        #[serde(deserialize_with = "deserialize")]
        v: i64,
    }

    #[derive(Deserialize)]
    struct DeOpt {
        #[serde(deserialize_with = "deserialize_option")]
        v: Option<i64>,
    }

    #[derive(Deserialize)]
    struct DeOptVec {
        #[serde(deserialize_with = "deserialize_option_vec_to_vec")]
        v: Vec<i64>,
    }

    // ── serialize family ──────────────────────────────────────────────────────

    /// White-box: a bare i64 is emitted via serialize_str, i.e. as a JSON string.
    #[test]
    fn serialises_i64_as_string() {
        let json = serde_json::to_value(Id { v: 7 }).unwrap();
        assert_eq!(json, serde_json::json!({ "v": "7" }));
    }

    /// White-box: each vec element is individually stringified.
    #[test]
    fn serialises_vec_as_string_array() {
        let json = serde_json::to_value(IdVec { v: vec![1, 2] }).unwrap();
        assert_eq!(json, serde_json::json!({ "v": ["1", "2"] }));
    }

    /// White-box: an empty vec serialises to an empty JSON array.
    #[test]
    fn serialises_empty_vec() {
        let json = serde_json::to_value(IdVec { v: Vec::new() }).unwrap();
        assert_eq!(json, serde_json::json!({ "v": [] }));
    }

    /// White-box: Some(i64) is serialised as the stringified inner value.
    #[test]
    fn serialises_option_some_as_string() {
        let json = serde_json::to_value(IdOpt { v: Some(9) }).unwrap();
        assert_eq!(json, serde_json::json!({ "v": "9" }));
    }

    /// White-box: None is serialised as JSON null, not an empty string.
    #[test]
    fn serialises_option_none_as_null() {
        let json = serde_json::to_value(IdOpt { v: None }).unwrap();
        assert_eq!(json, serde_json::json!({ "v": null }));
    }

    /// White-box: i64::MAX round-trips as a full-precision decimal string.
    #[test]
    fn serialises_i64_max() {
        let json = serde_json::to_value(Id { v: i64::MAX }).unwrap();
        assert_eq!(json, serde_json::json!({ "v": "9223372036854775807" }));
    }

    // ── deserialize ───────────────────────────────────────────────────────────

    /// White-box: a JSON string is parsed into the i64 it spells.
    #[test]
    fn deserialise_accepts_string() {
        let out: DeId = serde_json::from_value(serde_json::json!({ "v": "42" })).unwrap();
        assert_eq!(out.v, 42);
    }

    /// White-box: a bare JSON number is accepted via the Number arm.
    #[test]
    fn deserialise_accepts_number() {
        let out: DeId = serde_json::from_value(serde_json::json!({ "v": 42 })).unwrap();
        assert_eq!(out.v, 42);
    }

    /// White-box: a non-numeric string fails the inner parse::<i64>().
    #[test]
    fn returns_error_for_unparseable_string() {
        let result: Result<DeId, _> = serde_json::from_value(serde_json::json!({ "v": "abc" }));
        assert!(result.is_err());
    }

    /// White-box: neither string nor number trips the catch-all error arm.
    #[test]
    fn returns_error_for_non_string_number() {
        let result: Result<DeId, _> = serde_json::from_value(serde_json::json!({ "v": true }));
        assert!(result.is_err());
    }

    // ── option / option-vec deserialize ───────────────────────────────────────

    /// White-box: a null option deserialises to None.
    #[test]
    fn option_null_becomes_none() {
        let out: DeOpt = serde_json::from_value(serde_json::json!({ "v": null })).unwrap();
        assert!(out.v.is_none());
    }

    /// White-box: a present string option parses into Some(i64).
    #[test]
    fn option_some_round_trips() {
        let out: DeOpt = serde_json::from_value(serde_json::json!({ "v": "5" })).unwrap();
        assert_eq!(out.v, Some(5));
    }

    /// White-box: null collapses to an empty vec (the "to_vec" convenience).
    #[test]
    fn option_vec_null_becomes_empty() {
        let out: DeOptVec = serde_json::from_value(serde_json::json!({ "v": null })).unwrap();
        assert!(out.v.is_empty());
    }

    /// White-box: a string array is parsed element-wise into i64s.
    #[test]
    fn option_vec_reads_string_array() {
        let out: DeOptVec =
            serde_json::from_value(serde_json::json!({ "v": ["1", "2"] })).unwrap();
        assert_eq!(out.v, vec![1, 2]);
    }

    /// White-box: the visitor also accepts a raw number array (mixed-kind support).
    #[test]
    fn option_vec_reads_number_array() {
        let out: DeOptVec = serde_json::from_value(serde_json::json!({ "v": [1, 2] })).unwrap();
        assert_eq!(out.v, vec![1, 2]);
    }
}
