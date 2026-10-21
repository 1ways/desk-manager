export const overlapFilter = (from: Date, to: Date) => ({
    startTime: { $lt: to },
    endTime: { $gt: from }
})