# Build Stage
FROM alpine:3.18 AS builder

# Install build dependencies
RUN apk add --no-cache build-base cmake

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Build the application
RUN mkdir build && cd build && \
    cmake -DCMAKE_BUILD_TYPE=Release .. && \
    make

# Runtime Stage
FROM alpine:3.18

# Install runtime dependencies (libstdc++ is needed for C++ apps)
RUN apk add --no-cache libstdc++

# Set working directory
WORKDIR /app

# Copy the executable from the builder stage
COPY --from=builder /app/build/tax_engine .

# Expose the port
EXPOSE 8080

# Run the application
CMD ["./tax_engine"]
