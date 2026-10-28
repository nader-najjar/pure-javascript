FROM node:24.22.1-bookworm-slim@sha256:be8204d4bd327363357f532187b752ff62759c31bedf98e9e18fc08c9cbd605c

# Packaging only: Bazel compiles and assembles production dependencies first.
ENV NODE_ENV=production
WORKDIR /custom-software/runtime-workspace/executable
COPY --chown=node:node executable ./
USER node
ENTRYPOINT ["node", "--enable-source-maps"]
CMD ["/custom-software/runtime-workspace/executable/Main.js"]
