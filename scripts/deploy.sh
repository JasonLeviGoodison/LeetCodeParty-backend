#!/bin/bash

echo "Downloading the AWS eb cli"
echo "THIS SCRIPT ONLY WORKS ON MAC OS WITH HOMEBREW INSTALLED"

brew update
brew install awsebcli || true
eb --version

read -p "Are you sure you want to deploy to production? [Y/N]: " -n 1 -r
echo    # (optional) move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

echo "Trying to deploy the service"

echo "----------FIRST TIME DEPLOYING?----------"
echo "If this is your first time deloying, you will be asked for credentials. To get them, follow these steps:"
echo "Sign in to the AWS Management Console as an IAM user. For more information, see Sign in as an IAM user in the IAM User Guide."
echo "In the navigation bar on the upper right, choose your user name and then choose My Security Credentials."
echo "Tip"
echo "If you do not see the My Security Credentials page, you might be signed in as a federated user, not an IAM user. You can create and use temporary access keys instead."
echo "Choose AWS IAM credentials, Create access key. If you already have two access keys, the console displays a \"Limited exceeded\" error."
echo "When prompted, choose Download .csv file or Show secret access key. This is your only opportunity to save your secret access key."
echo "After you've saved your secret access key in a secure location, chose Close."
echo "DO NOT DEPLOY OR CHECK IN YOUR ACCESS KEY"
echo "-----------------------------------------"
echo
echo

eb deploy


// also set env variable