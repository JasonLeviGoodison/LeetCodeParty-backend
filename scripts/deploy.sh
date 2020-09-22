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
eb deploy
