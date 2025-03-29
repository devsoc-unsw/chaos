-- Your SQL goes here
CREATE TABLE short_answer_answers ( -- TODO: Need to seed this table with data from the current answers table
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    answer_id INT NOT NULL,
    CONSTRAINT fk_short_answer_answer_parent_answer
        FOREIGN KEY(answer_id)
            REFERENCES answers(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);


CREATE TABLE multi_select_options(
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    question_id INT NOT NULL,
    CONSTRAINT fk_multi_select_option_parent_question
        FOREIGN KEY(question_id)
            REFERENCES questions(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);

CREATE TABLE multi_select_answers (
    id SERIAL PRIMARY KEY,
    option_id INT NOT NULL,
    answer_id INT NOT NULL,

    CONSTRAINT fk_multi_select_answer_parent_answer
        FOREIGN KEY(answer_id)
            REFERENCES answers(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,

--  If the option is deleted, then the selection should be too
    CONSTRAINT fk_multi_select_option
        FOREIGN KEY(option_id)
            REFERENCES  multi_select_options(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);