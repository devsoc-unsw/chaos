use serde::ser::{SerializeSeq, Serializer};

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

