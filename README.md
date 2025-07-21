# Simple RAG Pipeline

This project is a beginner-friendly tutorial project for building a Retrieval Augmented Generation (RAG) system.

# Setup 
Make sure docker is installed in your system. If not, follow [this](https://docs.docker.com/compose/install/) page to get it installed. 

Before starting the service, go into generator -> Dockerfile. Replace the _token_here_ keyword with your gemini API key.

To start the pipeline service, enter the following command.

```bash
docker compose up
```

Note: If using linux, you might need to prefix the command with `sudo` run as privileged command.


# Usage
Currently, there are only 2 things that the pipeline can do:
- Add documents into the knowledge base
- Query the model 

To add documents into the knowledge base, upload the documents via POST to `http://127.0.0.1:8000/`. This can be done minimally with the curl CLI with `curl http://127.0.0.1:8000 -F "files=@name_of_the_file.pdf"`

To query the model, simply perform a GET request to `http://127.0.0.1:8000/` with the query parameter as the prompt to the model. For example, by typing `http://127.0.0.1:8000/?query=what is swan lagoon` to the browser.