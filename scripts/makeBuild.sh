#!/bin/bash

echo "Making Build Zip File"

epochTime=`date +%s`
zipFileName="be-build-${epochTime}"
zip -r $zipFileName .

echo "The ZipFile is named ${zipFileName}.zip. Please don't check this in."