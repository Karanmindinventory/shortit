# shortit

A high-performance URL shortener built with Node.js, Express, and MySQL. Originally started as a project to learn Sequelize ORM, it evolved into an exploration of custom database sharding algorithms and scalable system design.

---

# Sharding Architecture

## The Core Problem

A standard URL shortener stores every link in a single database table. This works fine at small scale, but as the table grows to millions of rows, every lookup becomes slower. The index depth increases, writes start to bottleneck, and the only solution becomes throwing more expensive hardware at the problem.

This project solves that problem algorithmically, not with hardware.

## How It Works

### 1. The Central Routing Table

A single metadata table is maintained with one row. That row stores two things: the name of the currently active write table, and the current row count of that table. When the count hits 25,000, a new table is created automatically, and the metadata row is updated to point to it.

### 2. Zero-Free Table Naming

Every shard table is named using a number that never contains the digit zero. The sequence goes 1, 2, 3 ... 9, 11, 12 ... 99, 111, 112 and so on, skipping any number that would contain a zero. This rule is fundamental to the encoding scheme described below.

### 3. The Zero-Separator Encoding

When a URL is stored, the system generates a short code by combining three pieces of information into a single number: the table name, a zero as a separator, and the row ID.

Example: if the URL was saved in table 111 with row ID 47, the code becomes 111047. The first zero in that number is always the separator.

At redirect time, the decoder splits on the first zero. Everything to the left is the table name (111), everything to the right is the row ID (47). The system then runs a single direct Primary Key query: SELECT from table 111 where id = 47. There is no lookup table, no cache, and no hash ring. The routing address is encoded inside the key itself.

Because table names are guaranteed to never contain a zero, the separator is always unambiguous.

### 4. Five Parallel Write Shards (Round-Robin)

A single write table creates a bottleneck under high concurrency because multiple requests compete for the same auto-increment lock. To solve this, five independent shard groups are maintained simultaneously, with writes distributed across them in a round-robin pattern.

To ensure the five shards never generate conflicting table names, their starting points are mathematically separated by a large gap: the five shards start at 1, 11111, 22222, 33333, and 44444 respectively. At 25,000 rows per table, the shards would need to run for an extraordinary amount of time before their table name sequences could ever overlap.

---

# Benchmark Results

All tests below ran against a live MySQL database with real reads and writes. No mocking, no in-memory shortcuts.

### Machine 1: 2014 Mac Mini (Intel i5-4278U, 2 Physical Cores, 8GB DDR3)

| Configuration | Total Requests | Total Time (ms) | Throughput (req/sec) | Avg Latency | Fastest | Slowest | P95 | P99 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 Core | 500,000 | 227,939 | 2,193.57 | 22.75 ms | 7.75 ms | 269.22 ms | 36.25 ms | 47.59 ms |
| 2 Cores | 500,000 | 201,536 | 2,480.95 | 20.09 ms | 1.38 ms | 230.56 ms | 33.88 ms | 45.10 ms |
| 2 Cores (1M) | 1,000,000 | 302,280 | 3,308.19 | 15.07 ms | 1.66 ms | 198.83 ms | 23.70 ms | 32.06 ms |
| 3 Cores | 500,000 | 172,265 | 2,902.50 | 17.17 ms | 1.35 ms | 191.90 ms | 33.02 ms | 50.98 ms |
| 3 Cores (1M) | 1,000,000 | 355,736 | 2,811.07 | 17.73 ms | 1.16 ms | 200.95 ms | 35.86 ms | 52.35 ms |
| 4 Cores | 500,000 | 219,349 | 2,279.47 | 21.88 ms | 1.32 ms | 346.40 ms | 49.38 ms | 68.50 ms |
| 5 Cores (1M) | 1,000,000 | 303,974 | 3,289.76 | 15.15 ms | 1.06 ms | 346.21 ms | 30.38 ms | 41.48 ms |
| 8 Cores | 500,000 | 190,483 | 2,624.91 | 18.99 ms | 1.07 ms | 419.92 ms | 46.03 ms | 69.47 ms |
| 16 Cores | 500,000 | 212,809 | 2,349.52 | 21.22 ms | 1.01 ms | 818.83 ms | 48.40 ms | 71.10 ms |

Note: Performance peaks at 2 cores and degrades beyond that because this machine only has 2 physical cores. Spawning more workers than available physical cores causes the CPU to spend more time switching between processes than actually doing work.

### Machine 2: 20-Core Server

| Configuration | Total Requests | Total Time (ms) | Throughput (req/sec) | Avg Latency | Fastest | Slowest | P95 | P99 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 20 Cores | 1,000,000 | 57,224 | 17,475.19 | 2.85 ms | 0.52 ms | 93.06 ms | 4.89 ms | 8.37 ms |

On a machine with 20 real cores available, the same code with zero changes processed 1,000,000 database-backed redirects in under 60 seconds at an average latency of 2.85 milliseconds. This demonstrates that the bottleneck in the Mac Mini tests was purely the hardware, not the algorithm.
