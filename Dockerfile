FROM node:alpine

COPY . .
RUN yarn install --production

ENV PORT 4000
EXPOSE 4000

CMD ["yarn", "start"]
