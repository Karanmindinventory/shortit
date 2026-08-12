# shortit
A simple URL shortner which is build to learn the ORM using sequlize orm in node.js

# SHARDING DOCUMENATAION

- we are gonna maintain one central table which contains the last table name and that table is only with the one row which contains the last table name like url_1 or what ever and we are gonna have column as current value so it dispaly the current items in the table if it 100 we are gonna create a new table and update table name here and also gonna upate the counter here or we can automate this counter
- in every new table we are gonna keep the name as url_(table numeber) and this table number never gonna contains any 0 it need to keep the number form 1 to 9 like 1 2 3 ...99 and then if 100 then 111 and if 1000 then 1111 of 11110 then 11111 just like this it should not contains 0
- and at the encryption time or a code generation time we are gonna keep the table number like 111 append 0 and append the id of the data and we are gonna generate the on number like 11101 where first occuring 0 is the seprator and 111 is table name and another 1 is the id of it.
- and at the decryption time we gonna feed the code in the decryptor function and imageing our function return a code like 111090 ten the 111 is table and 90 is id so our table name gonna be url_111 and query gonnna be select * from url_111 where id = 90 simple

# ADDITION
- we are gonna keep table name as 1 2 and 3 ... 111 ...1111...1111 only not URL and all so the the concatication cost reduced even more.
- and gonna create a trigger there so we can actively track and monitor those id's
- now here becuse 1 writing table is creating a bottle neck we are gonna maintain the 5 seprate table and we are writing data in the round-robin patter and each we need to make a one function who prevent the same table name like if we have table name like 1 2 3 4 5 and 1 and 5 are both gonna filled at same or somthing like that both are not gonna assign the number 6 so for the we are gonna keep on more row with the named next table for safe gaurd we always gonna take this table name too seprated like the range gonna be first table is 1 then other table gonnna be 11111 and other tbale gonnna be 22222 and other table gonnan be 33333 and otehr table gonna be 44444 so at any point they where not gonna fill the same time
- **THIS ENSURE THE RETRIVAL TIME 1 to 5 MS**
## 📊 Benchmark Results

Performance metrics captured across a comprehensive load test of **500,000 total requests**.

### 📈 Throughput & Execution

| Metric | Value |
| :--- | :--- |
| **Total Requests** | 500,000 |
| **Total Wall Clock Time** | 227,939 ms (~227.94s) |
| **Throughput** | **2,193.57 req/sec** |

### ⏱️ Latency Percentiles

| Percentile / Metric | Latency |
| :--- | :--- |
| **Average Latency** | 22.75 ms |
| **P95 Latency** | 36.25 ms |
| **P99 Latency** | 47.59 ms |
| **Fastest Request** | 7.75 ms |
| **Slowest Request** | 269.22 ms |
