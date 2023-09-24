# microservice-project

This is a demo microserivce project

How to use:

1. Run `docker compose up` in root directory to create and start a docker container for the node app.

   - It serves the HTML for the book listings on `loalhost:90`

2. Run `docker compose up` in the flask_app directory to create and start a docker container for the python app.

   - It provides `GET` and `POST` endpoints to calculate the average rating of a book.

These container talk over the local host by using the special Docker URL [host.docker.internal](https://docs.docker.com/desktop/networking/#i-want-to-connect-from-a-container-to-a-service-on-the-host). Direct communication through container names is also possible. This requires some adjustments (comment in appropriate sections).

This project originates from AppAcademy Online.
