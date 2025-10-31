use serde::{de::Error, Deserializer, ser::{SerializeSeq, Serializer}, Deserialize};
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
    let s = String::deserialize(deserializer)?;
    s.parse::<i64>().map_err(Error::custom)
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
                serde_json::Value::Number(n) => {
                    n.as_i64().ok_or_else(|| Error::custom("number out of range for i64"))?
                }
                _ => return Err(Error::custom("expected string or number in roles array")),
            };
            vec.push(parsed);
        }
        Ok(vec)
    }
}
