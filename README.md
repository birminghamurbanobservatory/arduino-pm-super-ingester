# Arduino PM Ingester (super version)

Serves a HTTP endpoint to which the Sigfox backend forwards sensor data to. This sensor data is formatted into a Urban Observatory compliant format and passed onto the event stream for processing and saving by other microservices.

It can also apply calibration corrections.

## API Authentication

The API is authenticated with an API Key set in the environment variables. It should be provided as the value of the `x-api-key` header.