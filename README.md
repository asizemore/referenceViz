# Visualization of bibilography database

*Last updated 04.22.21*

<br>

## How to create these visualizations

### *Step 0: Setting up the container*

Included with the repository is all needed files to create a docker container in which to run this project. It is not necessary to run the code within the container, but it is highly recommended. 

To get started, download [Docker](https://www.docker.com/products/docker-desktop) and ensure it is running. In the terminal, navigate to this directory and run `make build` to build the container (may also require installing make), and then `docker run -it --rm -p 8888:8888 -v "$(pwd):/home/jovyan/" dabi:v0` to run the container. 

<br>

### *Step 1: Process raw data*

The included jupyter notebooks produce .csv files which the visualizations will consume. Each notebook reads in raw data from the `raw_data` folder, and will write their csv files to the `data` folder.

<br>

### *Step 2: Start python simple server*

An easy way to run the visualization locally is through python's simple server. Navigate to this project's directory and run `python -m SimpleHTTPServer 9100` in the terminal. Navigate to `http://127.0.0.1:9100/` (or equivalent).

<br>

### *Step 3: View the visualization*

Selct "templates" then pick any of the three .html files. Enjoy!


<br>