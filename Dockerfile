FROM jupyter/datascience-notebook:9f4983c5d1f3

RUN pip install networkx
RUN pip install utils
RUN pip install "flask==1.0.1" "CairoSVG==2.1.3"
RUN pip install markdown
RUN pip install pelican
RUN pip install llvmlite --ignore-installed
RUN pip install umap-learn



USER root
RUN apt-get update && apt-get install -y \
  libz-dev \
  libc-dev \
  build-essential \
  gcc
  # curl\
  # nodejs
USER jovyan


RUN pip install python-Levenshtein
RUN pip install gensim==3.8.3
RUN pip install spacy
RUN python -m spacy download en_core_web_sm

EXPOSE 8888
