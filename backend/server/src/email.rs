use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::env;
use std::str::Chars;

///
/// First parse a message with ParsedTemplate::from_template(message, vars) where vars is hashset
/// of all the vars you expect to use.
/// Then convert to MappedTemplate with ParsedTemplate::to_mapped(vars) where vars is a hashmap
/// with all the vars required.
/// then call render on the result.
///
/// Variables will probably be stuff like `role`, `first_name`, `last_name` etc.
/// Variables are inside {{}} in the template string.
///

pub struct MappedTemplate {
    exprs: Vec<TemplateExpr>,
    vars: HashSet<String>,
    mappings: HashMap<String, String>,
}

pub struct ParsedTemplate {
    exprs: Vec<TemplateExpr>,
    vars: HashSet<String>, // we end up cloning this heaps, could make it a persistent set instead
}

enum TemplateExpr {
    String(String),
    Variable(String),
}

#[derive(Serialize)]
pub enum TemplateErr {
    InvalidExpr,
    InvalidVariable(String),
    InvalidMappings,
}

impl ParsedTemplate {
    /// Template is string "thingy thingy so and so {{var}} thingy"
    /// replaced with "thingy thingy so and so value thingy"
    pub fn from_template(
        template: String,
        vars: HashSet<String>,
    ) -> Result<ParsedTemplate, TemplateErr> {
        let mut curr = String::new();
        let mut res = Vec::new();
        let mut s = template.chars();
        while let Some(c) = s.next() {
            if c == '{' {
                if s.next() == Some('{') {
                    let var = Self::get_inside_braces(&mut s)?;

                    if !vars.contains(&var) {
                        return Err(TemplateErr::InvalidVariable(var));
                    }

                    if curr.len() > 0 {
                        res.push(TemplateExpr::String(curr));
                        curr = String::new();
                    }
                    res.push(TemplateExpr::Variable(var));
                } else {
                    curr.push(c);
                }
            } else {
                curr.push(c);
            }
        }

        if curr.len() > 0 {
            res.push(TemplateExpr::String(curr));
        }

        Ok(ParsedTemplate { exprs: res, vars })
    }

    fn get_inside_braces(s: &mut Chars) -> Result<String, TemplateErr> {
        let mut inside = String::new();
        while let Some(c) = s.next() {
            match c {
                '}' => {
                    if s.next() != Some('}') {
                        return Err(TemplateErr::InvalidExpr);
                    }
                }
                _ => inside.push(c),
            }
        }
        Ok(inside)
    }

    pub fn to_mapped(
        self,
        mappings: HashMap<String, String>,
    ) -> Result<MappedTemplate, TemplateErr> {
        for var in &self.vars {
            if !mappings.contains_key(var) {
                return Err(TemplateErr::InvalidMappings);
            }
        }

        Ok(MappedTemplate {
            exprs: self.exprs,
            vars: self.vars,
            mappings,
        })
    }
}

impl std::convert::From<MappedTemplate> for ParsedTemplate {
    fn from(mapped: MappedTemplate) -> Self {
        ParsedTemplate {
            exprs: mapped.exprs,
            vars: mapped.vars,
        }
    }
}

impl MappedTemplate {
    pub fn render(&self) -> String {
        let mut res = String::new();
        for expr in &self.exprs {
            match expr {
                TemplateExpr::String(s) => res.push_str(s),
                TemplateExpr::Variable(v) => res.push_str(self.mappings.get(v).unwrap()),
            }
        }
        res
    }
}

pub fn send_email(to: String, subject: String, body: String) -> Option<()> {
    let email = Message::builder()
        .from("CSESoc <noreply@csesoc.org.au>".parse().unwrap())
        .to(to.parse().ok()?)
        .subject(subject)
        .body(body)
        .unwrap();

    let smtp_username = env::var("SMTP_USERNAME").expect("SMTP_USERNAME must be set in env");
    let smtp_password = env::var("SMTP_PASSWORD").expect("SMTP_PASSWORD must be set in env");
    let creds = Credentials::new(smtp_username, smtp_password);

    // Open a remote connection to gmail
    let mailer = SmtpTransport::relay("smtp.gmail.com")
        .unwrap()
        .credentials(creds)
        .build();

    mailer.send(&email).ok().map(|_| ())
}
