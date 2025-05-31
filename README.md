This is a clone of Vercel application.

# Design

    -> User Adds Git URL from GUI 
    -> Backend service clones and uploads all the files to S3 and adds to queue
    -> Deploy service pulls and builds the repo from the queue and uploads build again to S3
    -> Handler is responsible serving deployed builds