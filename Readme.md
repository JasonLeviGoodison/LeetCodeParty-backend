# Leetcode Party

## E2E Diagram
[Lucid Chart](https://app.lucidchart.com/documents/edit/47d5da20-8b85-43c2-bd5b-e01e243f7af1/0_0?beaconFlowId=4B78530DB65484E3#?folder_id=home&browser=icon)

## Running Server

    make run

## Setting up

### PostgreSQL DB
[Download](https://www.postgresql.org/download/macosx/)  and install PostgreSQL

Create a new database, which can be done using the following psql commands in your terminal:

```
psql
CREATE DATABASE leetparty;

```

Keep track of this database name (leetparty), you will need to add this to the new secrets file.

_Side Note: I also am a pretty big fan of this  [GUI representation app](https://eggerapps.at/postico/)  of a your psql databases. Feel free to use it to visualize your data a bit easier_