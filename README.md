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

### Benchmark Results


| Configuration | Total Requests | Total Time (ms) | Throughput (req/sec) | Avg Latency | Fastest Request | Slowest Request | P95 Latency | P99 Latency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1 Core** | 500,000 | 227,939 | 2,193.57 | 22.75 ms | 7.75 ms | 269.22 ms | 36.25 ms | 47.59 ms |
| **2 Cores** | 500,000 | 201,536 | 2,480.95 | 20.09 ms | 1.38 ms | 230.56 ms | 33.88 ms | 45.10 ms |
| **2 Cores (1M)** | 1,000,000 | 302,280 | **3,308.19** | **15.07 ms** | 1.66 ms | 198.83 ms | **23.70 ms** | **32.06 ms** |
| **3 Cores** | 500,000 | 172,265 | 2,902.50 | 17.17 ms | 1.35 ms | **191.90 ms** | 33.02 ms | 50.98 ms |
| **3 Cores (1M)** | 1,000,000 | 355,736 | 2,811.07 | 17.73 ms | 1.16 ms | 200.95 ms | 35.86 ms | 52.35 ms |
| **4 Cores** | 500,000 | 219,349 | 2,279.47 | 21.88 ms | 1.32 ms | 346.40 ms | 49.38 ms | 68.50 ms |
| **5 Cores (1M)** | 1,000,000 | 303,974 | 3,289.76 | 15.15 ms | **1.06 ms** | 346.21 ms | 30.38 ms | 41.48 ms |
| **8 Cores** | 500,000 | 190,483 | 2,624.91 | 18.99 ms | 1.07 ms | 419.92 ms | 46.03 ms | 69.47 ms |
| **16 Cores** | 500,000 | 212,809 | 2,349.52 | 21.22 ms | 1.01 ms | 818.83 ms | 48.40 ms | 71.10 ms |

