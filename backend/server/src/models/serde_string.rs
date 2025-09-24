use serde::{de::Error, Deserializer, ser::{SerializeSeq, Serializer}, Deserialize};

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

