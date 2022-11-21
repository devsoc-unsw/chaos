const Success = `Hi {name},

Thank you for applying for {role} and attending the interview :) We had many applicants this year and your application really stood out! Congratulations - we want you on the team for 2022!

{organisation}`;

const Rejected = `Hi {name},

Thank you for applying for {role}. Unfortunately, we regret to inform you that you have been unsuccessful with your application.

Get owned loser :omegalul:

{organisation}`;

const templates: { [k: string]: string } = {
  Success,
  Rejected,
};

export default templates;
