const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const { Queue: QueueMQ, Worker } = require("bullmq");
const express = require("express");
const { config } = require("dotenv");

config({ path: `${process.env.NODE_ENV}.env` });

const { REDIS_PORT, REDIS_HOST, MESSAGE_QUEUE_NAME, REDIS_PASSWORD, PORT } =
  process.env;

const sleep = (t) => new Promise((resolve) => setTimeout(resolve, t * 1000));

const redisOptions = {
  port: REDIS_PORT,
  host: REDIS_HOST,
  password: REDIS_PASSWORD,
  tls: false,
};

const createQueueMQ = (name) => new QueueMQ(name, { connection: redisOptions });

function setupBullMQProcessor(queueName) {
  new Worker(
    queueName,
    async (job) => {
      for (let i = 0; i <= 100; i++) {
        await sleep(Math.random());
        await job.updateProgress(i);
        await job.log(`Processing job at interval ${i}`);

        if (Math.random() * 200 < 1) throw new Error(`Random error ${i}`);
      }

      return { jobId: `This is the return value of job (${job.id})` };
    },
    { connection: redisOptions }
  );
}

const run = async () => {
  const exampleBullMq = createQueueMQ(MESSAGE_QUEUE_NAME);

  await setupBullMQProcessor(exampleBullMq.name);

  const app = express();

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/ui");

  createBullBoard({
    queues: [new BullMQAdapter(exampleBullMq)],
    serverAdapter,
  });

  app.use("/ui", serverAdapter.getRouter());

  // app.use('/add', (req, res) => {
  //   const opts = req.query.opts || {};

  //   if (opts.delay) {
  //     opts.delay = +opts.delay * 1000; // delay must be a number
  //   }

  //   exampleBullMq.add('Add', { title: req.query.title }, opts);

  //   res.json({
  //     ok: true,
  //   });
  // });

  app.listen(PORT, () => {
    console.log(`Running on ${PORT}...`);
    console.log(`For the UI, open http://localhost:${PORT}/ui`);
    console.log("Make sure Redis is running on port 6379 by default");
  });
};

// eslint-disable-next-line no-console
run().catch((e) => console.error(e));
