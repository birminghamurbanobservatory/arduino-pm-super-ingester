# Arduino PM Ingester

Serves a HTTP endpoint to which the Sigfox backend forwards sensor data to. This sensor data is formatted into a Urban Observatory compliant format and passed onto the event stream for processing and saving by other microservices.