import prisma from '../config/prisma.js';

class QueueService {
  async enqueue(type, payload) {
    return await prisma.queue.create({
      data: { type, payload, status: 'pending' },
    });
  }

  async dequeue() {
    const job = await prisma.queue.findFirst({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });

    if (!job) return null;

    await prisma.queue.update({
      where: { id: job.id },
      data: { status: 'processing' },
    });

    return job;
  }

  async complete(id) {
    await prisma.queue.update({
      where: { id },
      data: { status: 'completed' },
    });
  }

  async fail(id, error) {
    await prisma.queue.update({
      where: { id },
      data: { status: 'failed', error },
    });
  }

  async getStats() {
    const result = await prisma.queue.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    return result.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {});
  }
}

export default new QueueService();
