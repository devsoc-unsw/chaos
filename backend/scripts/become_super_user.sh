#!/bin/bash

echo "Starting the script"
echo "===================="
echo "what is the email for the account?"
read SUPERUSER_EMAIL


echo "make $SUPERUSER_EMAIL a superuser? (y/n)"
read SUPERUSER_ANSWER
if [ "$SUPERUSER_ANSWER" == "n" ]; then
    echo "skipping superuser creation"
    exit
fi



# expose env variables from .env
if [ -f .env ]
then
  export $(cat .env | sed 's/#.*//g' | xargs)
else
  echo "no .env file found"
  exit
fi

echo "db url is $DATABASE_URL"

psql $DATABASE_URL << EOF

    UPDATE users SET superuser = true WHERE email = '$SUPERUSER_EMAIL';

EOF
