/// Used for `resource_id` parameter in SpiceDB whenever resource is `chaos/platform`
pub const PLATFORM_RESOURCE_ID: i64 = 0;

/// SpiceDB resource type constants.
pub mod resource {
    pub const USER: &str = "chaos/user";
    pub const PLATFORM: &str = "chaos/platform";
    pub const ORGANISATION: &str = "chaos/organisation";
    pub const EMAIL_TEMPLATE: &str = "chaos/email_template";
    pub const CAMPAIGN: &str = "chaos/campaign";
    pub const CAMPAIGN_ROLE: &str = "chaos/campaign_role";
    pub const QUESTION: &str = "chaos/question";
    pub const APPLICATION: &str = "chaos/application";
    pub const RATING: &str = "chaos/rating";
    pub const RATING_CATEGORY: &str = "chaos/rating_category";
    pub const CATEGORY_RATING: &str = "chaos/category_rating";
    pub const COMMENT: &str = "chaos/comment";
    pub const ANSWER: &str = "chaos/answer";
    pub const OFFER: &str = "chaos/offer";
}

/// SpiceDB relation name constants, namespaced by resource.
pub mod relation {
    pub mod platform {
        pub const SUPERUSER: &str = "superuser";
        pub const USER: &str = "user";
    }
    pub mod organisation {
        pub const PLATFORM: &str = "platform";
        pub const ADMIN: &str = "admin";
        pub const MEMBER: &str = "member";
    }
    pub mod email_template {
        pub const ORGANISATION: &str = "organisation";
    }
    pub mod campaign {
        pub const ORGANISATION: &str = "organisation";
    }
    pub mod campaign_role {
        pub const CAMPAIGN: &str = "campaign";
    }
    pub mod question {
        pub const CAMPAIGN: &str = "campaign";
    }
    pub mod rating_category {
        pub const CAMPAIGN: &str = "campaign";
    }
    pub mod category_rating {
        pub const RATING: &str = "rating";
    }
    pub mod application {
        pub const CAMPAIGN: &str = "campaign";
        pub const CREATOR: &str = "creator";
    }
    pub mod rating {
        pub const APPLICATION: &str = "application";
        pub const CREATOR: &str = "creator";
    }
    pub mod comment {
        pub const APPLICATION: &str = "application";
        pub const CREATOR: &str = "creator";
    }
    pub mod answer {
        pub const APPLICATION: &str = "application";
    }
    pub mod offer {
        pub const CAMPAIGN: &str = "campaign";
        pub const APPLICATION: &str = "application";
    }
}

/// SpiceDB permission name constants, namespaced by resource.
pub mod permission {
    pub mod platform {
        pub const MANAGE: &str = "manage";
        pub const USE: &str = "use";
    }
    pub mod organisation {
        pub const MANAGE: &str = "manage";
        pub const VIEW: &str = "view";
    }
    pub mod email_template {
        pub const MANAGE: &str = "manage";
        pub const VIEW: &str = "view";
    }
    pub mod campaign {
        pub const MANAGE: &str = "manage";
        pub const REVIEW: &str = "review";
    }
    pub mod campaign_role {
        pub const MANAGE: &str = "manage";
    }
    pub mod question {
        pub const MANAGE: &str = "manage";
    }
    pub mod rating_category {
        pub const MANAGE: &str = "manage";
        pub const VIEW: &str = "view";
    }
    pub mod category_rating {
        pub const EDIT: &str = "edit";
        pub const VIEW: &str = "view";
    }
    pub mod application {
        pub const VIEW: &str = "view";
        pub const EDIT: &str = "edit";
        pub const REVIEW: &str = "review";
    }
    pub mod rating {
        pub const EDIT: &str = "edit";
        pub const VIEW: &str = "view";
    }
    pub mod comment {
        pub const EDIT: &str = "edit";
        pub const VIEW: &str = "view";
    }
    pub mod answer {
        pub const EDIT: &str = "edit";
        pub const VIEW: &str = "view";
    }
    pub mod offer {
        pub const MANAGE: &str = "manage";
        pub const VIEW: &str = "view";
        pub const REPLY: &str = "reply";
    }
}
