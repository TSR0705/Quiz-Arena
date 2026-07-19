export async function seed(knex) {
  await knex('attempt_answers').del();
  await knex('attempt_questions').del();
  await knex('quiz_attempts').del();
  await knex('question_reports').del();
  await knex('question_ratings').del();
  await knex('questions').del();

  // Load topics
  const topics = await knex('topics').select('*');

  const findTopic = (slug) => topics.find(t => t.slug === slug);

  const osScheduling = findTopic('scheduling');
  const sqlQueries = findTopic('sql-queries');
  const dataStructures = findTopic('data-structures');
  const algorithms = findTopic('algorithms');
  const networks = findTopic('computer-networks');
  const react = findTopic('react');
  const nodejs = findTopic('node-js');
  const designPatterns = findTopic('design-patterns');
  const testing = findTopic('testing');
  const memoryMgmt = findTopic('memory-management');
  const fileSystems = findTopic('file-systems');
  const transactions = findTopic('transactions');

  const questions = [];

  // Helper to build a question object
  function q(topic, difficulty, text, options, correctIds, hint, explanation) {
    if (!topic) return;
    questions.push({
      category_id: topic.category_id,
      topic_id: topic.id,
      difficulty,
      question_type: 'single_choice',
      question_text: text,
      options_json: JSON.stringify(options),
      correct_answer_json: JSON.stringify(correctIds),
      hint,
      explanation,
      status: 'published'
    });
  }

  // ============================================
  // OS Scheduling (5 easy)
  // ============================================
  q(osScheduling, 'easy',
    'Which CPU scheduling algorithm schedules processes in the order they arrive?',
    [{id:'opt_1',text:'First-Come, First-Served (FCFS)'},{id:'opt_2',text:'Shortest Job First (SJF)'},{id:'opt_3',text:'Round Robin (RR)'},{id:'opt_4',text:'Priority Scheduling'}],
    ['opt_1'], 'It is a non-preemptive FIFO algorithm.',
    'First-Come First-Served (FCFS) schedules processes based on their arrival time, executing the first arrived process first.');

  q(osScheduling, 'easy',
    'What scheduling algorithm uses a time quantum?',
    [{id:'opt_1',text:'FCFS'},{id:'opt_2',text:'Round Robin (RR)'},{id:'opt_3',text:'Shortest Job First'},{id:'opt_4',text:'Priority'}],
    ['opt_2'], 'It is designed for time-sharing systems.',
    'Round Robin scheduling assigns a small, fixed unit of time called a time quantum or time slice to each process in turn.');

  q(osScheduling, 'easy',
    'Which of the following scheduling algorithms can result in process starvation?',
    [{id:'opt_1',text:'Round Robin'},{id:'opt_2',text:'First-Come, First-Served'},{id:'opt_3',text:'Priority Scheduling'},{id:'opt_4',text:'None of the above'}],
    ['opt_3'], 'Starvation happens when a low-priority process is indefinitely deferred.',
    'Priority Scheduling can result in starvation if high-priority processes continually arrive, blocking lower-priority processes.');

  q(osScheduling, 'easy',
    'What is "aging" in CPU scheduling?',
    [{id:'opt_1',text:'Decreasing priority of low-running tasks'},{id:'opt_2',text:'Gradually increasing priority of waiting tasks'},{id:'opt_3',text:'Removing old processes from the queue'},{id:'opt_4',text:'None of the above'}],
    ['opt_2'], 'It is a solution to the starvation problem.',
    'Aging is a technique that gradually increases the priority of processes that wait in the system for a long time.');

  q(osScheduling, 'easy',
    'In multilevel feedback queue scheduling, how is a process prevented from hogging the CPU?',
    [{id:'opt_1',text:'By demoting processes that use too much CPU time'},{id:'opt_2',text:'By blocking high-priority tasks'},{id:'opt_3',text:'By allocating longer quanta to demoted processes'},{id:'opt_4',text:'By prioritizing new processes over old ones'}],
    ['opt_1'], 'It demotes processes to lower priority queues.',
    'Multilevel feedback queue scheduling prevents CPU-bound processes from hogging the CPU by demoting them to lower-priority queues.');

  // ============================================
  // ============================================
  // SQL Queries (5 easy, 5 medium, 5 hard)
  // ============================================
  q(sqlQueries, 'easy',
    'Which SQL keyword is used to retrieve data from a table?',
    [{id:'opt_1',text:'GET'},{id:'opt_2',text:'EXTRACT'},{id:'opt_3',text:'SELECT'},{id:'opt_4',text:'RETRIEVE'}],
    ['opt_3'], 'It is the most common keyword in read operations.',
    'The SELECT statement is used to select data from a database.');

  q(sqlQueries, 'easy',
    'Which SQL clause is used to filter records?',
    [{id:'opt_1',text:'ORDER BY'},{id:'opt_2',text:'WHERE'},{id:'opt_3',text:'GROUP BY'},{id:'opt_4',text:'HAVING'}],
    ['opt_2'], 'It comes after the FROM clause.',
    'The WHERE clause is used to extract only those records that fulfill a specified condition.');

  q(sqlQueries, 'easy',
    'Which SQL constraint uniquely identifies each record in a database table?',
    [{id:'opt_1',text:'UNIQUE'},{id:'opt_2',text:'PRIMARY KEY'},{id:'opt_3',text:'FOREIGN KEY'},{id:'opt_4',text:'CHECK'}],
    ['opt_2'], 'It cannot contain NULL values and must be unique.',
    'A PRIMARY KEY constraint uniquely identifies each record in a table.');

  q(sqlQueries, 'easy',
    'Which statement is used to delete a table and all its data?',
    [{id:'opt_1',text:'DELETE TABLE'},{id:'opt_2',text:'REMOVE TABLE'},{id:'opt_3',text:'DROP TABLE'},{id:'opt_4',text:'TRUNCATE TABLE'}],
    ['opt_3'], 'It removes the table definition as well as data.',
    'The DROP TABLE statement is used to delete a table and all of its rows, indexes, and triggers.');

  q(sqlQueries, 'easy',
    'Which statement is used to add a new column to an existing table?',
    [{id:'opt_1',text:'UPDATE TABLE'},{id:'opt_2',text:'ALTER TABLE'},{id:'opt_3',text:'MODIFY TABLE'},{id:'opt_4',text:'INSERT INTO'}],
    ['opt_2'], 'It modifies the structure of the table.',
    'The ALTER TABLE statement is used to add, delete, or modify columns in an existing table.');

  q(sqlQueries, 'medium',
    'What is the difference between WHERE and HAVING clauses?',
    [{id:'opt_1',text:'WHERE filters rows; HAVING filters groups'},{id:'opt_2',text:'HAVING filters rows; WHERE filters groups'},{id:'opt_3',text:'They are completely interchangeable'},{id:'opt_4',text:'WHERE works with aggregate functions'}],
    ['opt_1'], 'Aggregates can only be filtered by HAVING.',
    'WHERE is applied to individual rows before grouping, while HAVING is applied to grouped results.');

  q(sqlQueries, 'medium',
    'Which join returns all rows from the left table and matched rows from the right?',
    [{id:'opt_1',text:'INNER JOIN'},{id:'opt_2',text:'RIGHT JOIN'},{id:'opt_3',text:'LEFT JOIN'},{id:'opt_4',text:'FULL OUTER JOIN'}],
    ['opt_3'], 'It preserves all rows from the primary left table.',
    'A LEFT JOIN returns all records from the left table, and the matched records from the right table.');

  q(sqlQueries, 'medium',
    'What is the default sort order of the ORDER BY clause?',
    [{id:'opt_1',text:'Descending'},{id:'opt_2',text:'Ascending'},{id:'opt_3',text:'Random'},{id:'opt_4',text:'None'}],
    ['opt_2'], 'It is alphabetically or numerically increasing.',
    'The ORDER BY keyword sorts the records in ascending order by default.');

  q(sqlQueries, 'medium',
    'Which SQL function returns the number of rows that match a specified criterion?',
    [{id:'opt_1',text:'SUM()'},{id:'opt_2',text:'COUNT()'},{id:'opt_3',text:'TOTAL()'},{id:'opt_4',text:'NUMBER()'}],
    ['opt_2'], 'It counts occurrences.',
    'The COUNT() function returns the number of rows that match a specified criterion.');

  q(sqlQueries, 'medium',
    'Which constraint prevents duplicate values in a column but allows NULLs?',
    [{id:'opt_1',text:'PRIMARY KEY'},{id:'opt_2',text:'NOT NULL'},{id:'opt_3',text:'UNIQUE'},{id:'opt_4',text:'CHECK'}],
    ['opt_3'], 'A primary key does not allow NULLs, but this constraint does.',
    'A UNIQUE constraint ensures that all values in a column are distinct, but it allows one or more NULL values depending on the database.');

  q(sqlQueries, 'hard',
    'Which operator is used inside a subquery to check if any rows exist that match the condition?',
    [{id:'opt_1',text:'EXISTS'},{id:'opt_2',text:'IN'},{id:'opt_3',text:'ANY'},{id:'opt_4',text:'ALL'}],
    ['opt_1'], 'It returns true if the subquery returns one or more records.',
    'The EXISTS operator is used to test for the existence of any record in a subquery.');

  q(sqlQueries, 'hard',
    'Which keyword is used to combine the results of two SELECT statements, removing duplicates?',
    [{id:'opt_1',text:'UNION ALL'},{id:'opt_2',text:'UNION'},{id:'opt_3',text:'JOIN'},{id:'opt_4',text:'INTERSECT'}],
    ['opt_2'], 'UNION ALL keeps duplicates, while this keyword removes them.',
    'The UNION operator is used to combine the result-set of two or more SELECT statements, returning distinct values.');

  q(sqlQueries, 'hard',
    'What index type is automatically created when a primary key is defined in most databases?',
    [{id:'opt_1',text:'Non-clustered Index'},{id:'opt_2',text:'Clustered Index'},{id:'opt_3',text:'Unique Hash Index'},{id:'opt_4',text:'Full-text Index'}],
    ['opt_2'], 'It determines the physical order of data storage.',
    'A Clustered index defines the physical order in which table data is stored. Most databases automatically create a clustered index on the primary key.');

  q(sqlQueries, 'hard',
    'Which window function assigns a unique sequential integer to rows within a partition?',
    [{id:'opt_1',text:'DENSE_RANK()'},{id:'opt_2',text:'RANK()'},{id:'opt_3',text:'ROW_NUMBER()'},{id:'opt_4',text:'NTILE()'}],
    ['opt_3'], 'It simply numbers the rows sequentially starting at 1.',
    'ROW_NUMBER() assigns a unique sequential integer to each row within a partition, starting at 1.');

  q(sqlQueries, 'hard',
    'Which JOIN produces a Cartesian product of the two tables?',
    [{id:'opt_1',text:'FULL JOIN'},{id:'opt_2',text:'CROSS JOIN'},{id:'opt_3',text:'OUTER JOIN'},{id:'opt_4',text:'INNER JOIN'}],
    ['opt_2'], 'It matches every row of the first table with every row of the second.',
    'A CROSS JOIN returns the Cartesian product of the two tables, matching every row of the first table with every row of the second.');


  // ============================================
  // Data Structures (5 easy)
  // ============================================
  q(dataStructures, 'easy',
    'Which data structure uses FIFO (First In, First Out) ordering?',
    [{id:'opt_1',text:'Stack'},{id:'opt_2',text:'Queue'},{id:'opt_3',text:'Tree'},{id:'opt_4',text:'Graph'}],
    ['opt_2'], 'Think of a line at a grocery store.',
    'A Queue follows First In, First Out ordering where the first element added is the first removed.');

  q(dataStructures, 'easy',
    'Which data structure uses LIFO (Last In, First Out) ordering?',
    [{id:'opt_1',text:'Queue'},{id:'opt_2',text:'Linked List'},{id:'opt_3',text:'Stack'},{id:'opt_4',text:'Array'}],
    ['opt_3'], 'Think of a stack of plates.',
    'A Stack follows Last In, First Out ordering where the last element added is the first removed.');

  q(dataStructures, 'easy',
    'What is the time complexity of accessing an element in an array by index?',
    [{id:'opt_1',text:'O(n)'},{id:'opt_2',text:'O(log n)'},{id:'opt_3',text:'O(1)'},{id:'opt_4',text:'O(n²)'}],
    ['opt_3'], 'Arrays allow direct memory address computation.',
    'Accessing an array element by index is O(1) because the memory address can be computed directly from the base address and index.');

  q(dataStructures, 'easy',
    'What type of tree has at most two children per node?',
    [{id:'opt_1',text:'B-Tree'},{id:'opt_2',text:'Binary Tree'},{id:'opt_3',text:'Trie'},{id:'opt_4',text:'AVL Tree'}],
    ['opt_2'], 'The name refers to the maximum number of children.',
    'A Binary Tree is a tree data structure in which each node has at most two children, referred to as left and right child.');

  q(dataStructures, 'easy',
    'Which data structure is best suited for implementing a dictionary or associative array?',
    [{id:'opt_1',text:'Linked List'},{id:'opt_2',text:'Stack'},{id:'opt_3',text:'Hash Table'},{id:'opt_4',text:'Queue'}],
    ['opt_3'], 'It uses a hash function for O(1) average lookup.',
    'A Hash Table provides O(1) average-case lookup, insertion, and deletion using a hash function to map keys to indices.');

  // ============================================
  // Algorithms (5 easy)
  // ============================================
  q(algorithms, 'easy',
    'What is the time complexity of binary search?',
    [{id:'opt_1',text:'O(n)'},{id:'opt_2',text:'O(log n)'},{id:'opt_3',text:'O(n log n)'},{id:'opt_4',text:'O(1)'}],
    ['opt_2'], 'It halves the search space each step.',
    'Binary search has O(log n) time complexity because it divides the sorted array in half with each comparison.');

  q(algorithms, 'easy',
    'Which sorting algorithm repeatedly finds the minimum element and places it at the beginning?',
    [{id:'opt_1',text:'Bubble Sort'},{id:'opt_2',text:'Merge Sort'},{id:'opt_3',text:'Selection Sort'},{id:'opt_4',text:'Quick Sort'}],
    ['opt_3'], 'It selects the smallest element in each pass.',
    'Selection Sort works by repeatedly finding the minimum element from the unsorted part and putting it at the beginning.');

  q(algorithms, 'easy',
    'What is the worst-case time complexity of Bubble Sort?',
    [{id:'opt_1',text:'O(n)'},{id:'opt_2',text:'O(n log n)'},{id:'opt_3',text:'O(n²)'},{id:'opt_4',text:'O(log n)'}],
    ['opt_3'], 'It uses nested loops that compare adjacent elements.',
    'Bubble Sort has O(n²) worst-case complexity because it needs nested iterations to compare and swap adjacent elements.');

  q(algorithms, 'easy',
    'Which algorithm technique breaks a problem into smaller subproblems and combines solutions?',
    [{id:'opt_1',text:'Greedy'},{id:'opt_2',text:'Dynamic Programming'},{id:'opt_3',text:'Divide and Conquer'},{id:'opt_4',text:'Backtracking'}],
    ['opt_3'], 'Think of Merge Sort splitting arrays in half.',
    'Divide and Conquer breaks a problem into smaller subproblems, solves them recursively, and combines the solutions.');

  q(algorithms, 'easy',
    'What does BFS stand for in graph algorithms?',
    [{id:'opt_1',text:'Binary First Search'},{id:'opt_2',text:'Breadth-First Search'},{id:'opt_3',text:'Best-First Search'},{id:'opt_4',text:'Backward Flow Search'}],
    ['opt_2'], 'It explores all neighbors at the present depth before moving on.',
    'Breadth-First Search explores all vertices at the present depth level before moving to vertices at the next depth level.');

  // ============================================
  // Computer Networks (5 easy)
  // ============================================
  q(networks, 'easy',
    'How many layers does the OSI model have?',
    [{id:'opt_1',text:'5'},{id:'opt_2',text:'6'},{id:'opt_3',text:'7'},{id:'opt_4',text:'4'}],
    ['opt_3'], 'Count from Physical to Application.',
    'The OSI model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application.');

  q(networks, 'easy',
    'Which protocol is used for reliable data transmission over the internet?',
    [{id:'opt_1',text:'UDP'},{id:'opt_2',text:'TCP'},{id:'opt_3',text:'ICMP'},{id:'opt_4',text:'ARP'}],
    ['opt_2'], 'It provides connection-oriented communication.',
    'TCP (Transmission Control Protocol) provides reliable, ordered, and error-checked delivery of data between applications.');

  q(networks, 'easy',
    'What is the default port number for HTTP?',
    [{id:'opt_1',text:'443'},{id:'opt_2',text:'21'},{id:'opt_3',text:'80'},{id:'opt_4',text:'22'}],
    ['opt_3'], 'HTTPS uses 443.',
    'HTTP uses port 80 by default, while HTTPS uses port 443.');

  q(networks, 'easy',
    'Which device operates at Layer 3 (Network Layer) of the OSI model?',
    [{id:'opt_1',text:'Hub'},{id:'opt_2',text:'Switch'},{id:'opt_3',text:'Router'},{id:'opt_4',text:'Repeater'}],
    ['opt_3'], 'It routes packets between different networks using IP addresses.',
    'A Router operates at Layer 3 and forwards packets between networks based on IP addresses.');

  q(networks, 'easy',
    'What does DNS stand for?',
    [{id:'opt_1',text:'Data Network System'},{id:'opt_2',text:'Domain Name System'},{id:'opt_3',text:'Digital Name Server'},{id:'opt_4',text:'Domain Node Service'}],
    ['opt_2'], 'It translates domain names to IP addresses.',
    'DNS (Domain Name System) translates human-readable domain names into IP addresses used by computers to locate services.');

  // ============================================
  // React (5 easy)
  // ============================================
  q(react, 'easy',
    'What hook is used for state management in React functional components?',
    [{id:'opt_1',text:'useEffect'},{id:'opt_2',text:'useReducer'},{id:'opt_3',text:'useState'},{id:'opt_4',text:'useContext'}],
    ['opt_3'], 'It returns a state variable and a setter function.',
    'useState is a React Hook that lets you add state to functional components. It returns a pair: the current state value and a function to update it.');

  q(react, 'easy',
    'What is JSX?',
    [{id:'opt_1',text:'A JavaScript compiler'},{id:'opt_2',text:'A syntax extension for JavaScript'},{id:'opt_3',text:'A CSS framework'},{id:'opt_4',text:'A testing library'}],
    ['opt_2'], 'It looks like HTML but lives in JavaScript.',
    'JSX is a syntax extension for JavaScript that looks similar to HTML and is used with React to describe what the UI should look like.');

  q(react, 'easy',
    'Which lifecycle method is equivalent to useEffect with an empty dependency array?',
    [{id:'opt_1',text:'componentDidMount'},{id:'opt_2',text:'componentWillUnmount'},{id:'opt_3',text:'componentDidUpdate'},{id:'opt_4',text:'shouldComponentUpdate'}],
    ['opt_1'], 'It runs only once after the initial render.',
    'useEffect with an empty dependency array [] runs only once after the initial render, similar to componentDidMount in class components.');

  q(react, 'easy',
    'What is the virtual DOM in React?',
    [{id:'opt_1',text:'A copy of the browser DOM stored in memory'},{id:'opt_2',text:'A server-side rendering engine'},{id:'opt_3',text:'A database for component state'},{id:'opt_4',text:'A CSS preprocessor'}],
    ['opt_1'], 'React uses it to efficiently update the real DOM.',
    'The virtual DOM is a lightweight in-memory representation of the real DOM. React uses it to determine what changes need to be made to the real DOM.');

  q(react, 'easy',
    'How do you pass data from a parent to a child component in React?',
    [{id:'opt_1',text:'Using state'},{id:'opt_2',text:'Using props'},{id:'opt_3',text:'Using context only'},{id:'opt_4',text:'Using refs'}],
    ['opt_2'], 'They are read-only in the child component.',
    'Props (short for properties) are used to pass data from parent to child components. They are read-only and cannot be modified by the child.');

  // ============================================
  // Node.js (5 easy)
  // ============================================
  q(nodejs, 'easy',
    'What is the event loop in Node.js?',
    [{id:'opt_1',text:'A graphical user interface'},{id:'opt_2',text:'A mechanism for handling asynchronous operations'},{id:'opt_3',text:'A database query engine'},{id:'opt_4',text:'A package manager'}],
    ['opt_2'], 'It allows Node.js to perform non-blocking I/O.',
    'The event loop is the mechanism that allows Node.js to handle asynchronous operations by offloading them and using callbacks when they complete.');

  q(nodejs, 'easy',
    'Which built-in module is used to work with file systems in Node.js?',
    [{id:'opt_1',text:'http'},{id:'opt_2',text:'path'},{id:'opt_3',text:'fs'},{id:'opt_4',text:'os'}],
    ['opt_3'], 'Its name stands for "file system".',
    'The fs (file system) module provides an API for interacting with the file system, allowing reading, writing, and manipulation of files.');

  q(nodejs, 'easy',
    'What is npm?',
    [{id:'opt_1',text:'Node Package Manager'},{id:'opt_2',text:'Node Programming Module'},{id:'opt_3',text:'Network Protocol Manager'},{id:'opt_4',text:'New Process Manager'}],
    ['opt_1'], 'It manages JavaScript packages.',
    'npm (Node Package Manager) is the default package manager for Node.js, used to install, share, and manage dependencies.');

  q(nodejs, 'easy',
    'What does require() do in Node.js?',
    [{id:'opt_1',text:'Creates a new file'},{id:'opt_2',text:'Imports a module'},{id:'opt_3',text:'Starts a server'},{id:'opt_4',text:'Runs a test'}],
    ['opt_2'], 'It is the CommonJS way to load modules.',
    'require() is used to import modules, JSON, and local files in Node.js using the CommonJS module system.');

  q(nodejs, 'easy',
    'Which Node.js module is used to create a web server?',
    [{id:'opt_1',text:'fs'},{id:'opt_2',text:'url'},{id:'opt_3',text:'http'},{id:'opt_4',text:'crypto'}],
    ['opt_3'], 'It provides HTTP server and client functionality.',
    'The http module provides the functionality to create HTTP servers and make HTTP requests in Node.js.');

  // ============================================
  // Design Patterns (5 easy)
  // ============================================
  q(designPatterns, 'easy',
    'Which design pattern ensures a class has only one instance?',
    [{id:'opt_1',text:'Factory'},{id:'opt_2',text:'Singleton'},{id:'opt_3',text:'Observer'},{id:'opt_4',text:'Strategy'}],
    ['opt_2'], 'Only one object of this class ever exists.',
    'The Singleton pattern restricts a class to a single instance and provides a global point of access to it.');

  q(designPatterns, 'easy',
    'Which design pattern provides an interface for creating objects without specifying the exact class?',
    [{id:'opt_1',text:'Singleton'},{id:'opt_2',text:'Observer'},{id:'opt_3',text:'Factory'},{id:'opt_4',text:'Decorator'}],
    ['opt_3'], 'It creates objects without exposing creation logic.',
    'The Factory pattern defines an interface for creating objects but lets subclasses decide which class to instantiate.');

  q(designPatterns, 'easy',
    'Which design pattern defines a one-to-many dependency so that when one object changes state, all dependents are notified?',
    [{id:'opt_1',text:'Strategy'},{id:'opt_2',text:'Observer'},{id:'opt_3',text:'Command'},{id:'opt_4',text:'Adapter'}],
    ['opt_2'], 'Think of a newspaper subscription.',
    'The Observer pattern defines a subscription mechanism to notify multiple objects about events that happen to the object they are observing.');

  q(designPatterns, 'easy',
    'Which design pattern category does the Adapter pattern belong to?',
    [{id:'opt_1',text:'Creational'},{id:'opt_2',text:'Structural'},{id:'opt_3',text:'Behavioral'},{id:'opt_4',text:'Concurrency'}],
    ['opt_2'], 'It converts the interface of a class into another interface.',
    'The Adapter pattern is a Structural pattern that allows incompatible interfaces to work together by wrapping an object in an adapter.');

  q(designPatterns, 'easy',
    'What does the MVC pattern stand for?',
    [{id:'opt_1',text:'Model-View-Controller'},{id:'opt_2',text:'Module-Version-Container'},{id:'opt_3',text:'Main-Value-Component'},{id:'opt_4',text:'Middleware-View-Cache'}],
    ['opt_1'], 'It separates an application into three concerns.',
    'MVC (Model-View-Controller) separates an application into three components: Model (data), View (UI), and Controller (logic).');

  // ============================================
  // Testing (5 easy)
  // ============================================
  q(testing, 'easy',
    'What type of testing verifies individual functions or methods in isolation?',
    [{id:'opt_1',text:'Integration Testing'},{id:'opt_2',text:'Unit Testing'},{id:'opt_3',text:'System Testing'},{id:'opt_4',text:'Acceptance Testing'}],
    ['opt_2'], 'It tests the smallest testable part.',
    'Unit Testing focuses on testing individual units of code (functions, methods, classes) in isolation from the rest of the application.');

  q(testing, 'easy',
    'What is the purpose of a test mock?',
    [{id:'opt_1',text:'To speed up test execution'},{id:'opt_2',text:'To simulate the behavior of real objects'},{id:'opt_3',text:'To measure code coverage'},{id:'opt_4',text:'To deploy test environments'}],
    ['opt_2'], 'It replaces a real dependency with a controlled substitute.',
    'A mock simulates the behavior of real objects in controlled ways, allowing tests to focus on the unit being tested without external dependencies.');

  q(testing, 'easy',
    'What does TDD stand for?',
    [{id:'opt_1',text:'Test-Driven Development'},{id:'opt_2',text:'Type-Defined Design'},{id:'opt_3',text:'Total Defect Detection'},{id:'opt_4',text:'Technical Design Document'}],
    ['opt_1'], 'Write tests before writing code.',
    'Test-Driven Development is a software development process where tests are written before the code that makes them pass.');

  q(testing, 'easy',
    'Which testing level checks the interaction between integrated modules?',
    [{id:'opt_1',text:'Unit Testing'},{id:'opt_2',text:'Integration Testing'},{id:'opt_3',text:'Regression Testing'},{id:'opt_4',text:'Smoke Testing'}],
    ['opt_2'], 'It tests how components work together.',
    'Integration Testing verifies that different modules or services work correctly when combined and interact as expected.');

  q(testing, 'easy',
    'What is code coverage?',
    [{id:'opt_1',text:'The number of bugs found'},{id:'opt_2',text:'The percentage of code executed during tests'},{id:'opt_3',text:'The number of test cases written'},{id:'opt_4',text:'The speed of test execution'}],
    ['opt_2'], 'It measures how much of your code runs during tests.',
    'Code coverage is a metric that measures the percentage of source code lines, branches, or paths executed during automated testing.');

  // ============================================
  // Memory Management (5 easy)
  // ============================================
  q(memoryMgmt, 'easy',
    'What is virtual memory?',
    [{id:'opt_1',text:'Memory stored in the cloud'},{id:'opt_2',text:'A memory management technique that uses disk space as an extension of RAM'},{id:'opt_3',text:'Cache memory'},{id:'opt_4',text:'Read-only memory'}],
    ['opt_2'], 'It allows programs larger than physical memory to run.',
    'Virtual memory is a technique that uses a portion of the hard drive as an extension of RAM, allowing the system to run programs larger than physical memory.');

  q(memoryMgmt, 'easy',
    'What is a page fault?',
    [{id:'opt_1',text:'A hardware error in memory chips'},{id:'opt_2',text:'An event when a requested page is not in physical memory'},{id:'opt_3',text:'A defective memory page'},{id:'opt_4',text:'An overflow in the page table'}],
    ['opt_2'], 'It triggers loading data from disk to memory.',
    'A page fault occurs when a program accesses a page that is mapped in virtual memory but not currently loaded in physical memory, requiring the OS to load it from disk.');

  q(memoryMgmt, 'easy',
    'Which page replacement algorithm replaces the page that has not been used for the longest time?',
    [{id:'opt_1',text:'FIFO'},{id:'opt_2',text:'LRU'},{id:'opt_3',text:'Optimal'},{id:'opt_4',text:'Random'}],
    ['opt_2'], 'It stands for Least Recently Used.',
    'LRU (Least Recently Used) replaces the page that has not been accessed for the longest period of time.');

  q(memoryMgmt, 'easy',
    'What is fragmentation in memory management?',
    [{id:'opt_1',text:'Breaking data into packets'},{id:'opt_2',text:'Wasted memory due to inefficient allocation'},{id:'opt_3',text:'Dividing memory into equal-sized frames'},{id:'opt_4',text:'Compressing memory contents'}],
    ['opt_2'], 'It can be internal or external.',
    'Fragmentation is the condition where free memory is broken into small, non-contiguous blocks, making it difficult to allocate large contiguous memory regions.');

  q(memoryMgmt, 'easy',
    'What is paging?',
    [{id:'opt_1',text:'A process scheduling algorithm'},{id:'opt_2',text:'A memory management scheme that eliminates external fragmentation'},{id:'opt_3',text:'A disk formatting technique'},{id:'opt_4',text:'A network routing protocol'}],
    ['opt_2'], 'It divides memory into fixed-size blocks.',
    'Paging is a memory management scheme that divides both physical and virtual memory into fixed-size blocks (frames and pages), eliminating external fragmentation.');

  // ============================================
  // File Systems (5 easy)
  // ============================================
  q(fileSystems, 'easy',
    'What is an inode in Unix file systems?',
    [{id:'opt_1',text:'A network node'},{id:'opt_2',text:'A data structure storing file metadata'},{id:'opt_3',text:'A process identifier'},{id:'opt_4',text:'A disk partition'}],
    ['opt_2'], 'It stores metadata but not the file name.',
    'An inode is a data structure in Unix-style file systems that stores file metadata including size, permissions, timestamps, and pointers to data blocks, but not the file name.');

  q(fileSystems, 'easy',
    'Which file system is commonly used by Windows?',
    [{id:'opt_1',text:'ext4'},{id:'opt_2',text:'NTFS'},{id:'opt_3',text:'HFS+'},{id:'opt_4',text:'ZFS'}],
    ['opt_2'], 'It stands for New Technology File System.',
    'NTFS (New Technology File System) is the standard file system used by Windows, supporting large files, permissions, encryption, and journaling.');

  q(fileSystems, 'easy',
    'What is a file descriptor?',
    [{id:'opt_1',text:'A physical storage device'},{id:'opt_2',text:'An integer that uniquely identifies an open file in a process'},{id:'opt_3',text:'A file extension'},{id:'opt_4',text:'A directory entry'}],
    ['opt_2'], 'It is returned by the open() system call.',
    'A file descriptor is a non-negative integer used by the OS to identify an open file within a process. It is returned by the open() system call.');

  q(fileSystems, 'easy',
    'What does journaling in a file system provide?',
    [{id:'opt_1',text:'Faster read speeds'},{id:'opt_2',text:'Recovery from crashes by logging changes before applying them'},{id:'opt_3',text:'File compression'},{id:'opt_4',text:'Network file sharing'}],
    ['opt_2'], 'It writes changes to a log before modifying the actual data.',
    'Journaling records changes in a log (journal) before committing them to the file system, enabling recovery from crashes and power failures.');

  q(fileSystems, 'easy',
    'What is the FAT file system?',
    [{id:'opt_1',text:'Fast Access Technology'},{id:'opt_2',text:'File Allocation Table'},{id:'opt_3',text:'Formatted Archive Type'},{id:'opt_4',text:'Fixed Address Table'}],
    ['opt_2'], 'It was originally designed for floppy disks.',
    'FAT (File Allocation Table) is a simple file system originally designed for floppy disks, using a table to track which clusters belong to each file.');

  // ============================================
  // Transactions (5 easy)
  // ============================================
  q(transactions, 'easy',
    'What does ACID stand for in database transactions?',
    [{id:'opt_1',text:'Atomicity, Consistency, Isolation, Durability'},{id:'opt_2',text:'Access, Control, Integrity, Data'},{id:'opt_3',text:'Authentication, Caching, Indexing, Distribution'},{id:'opt_4',text:'Allocation, Concurrency, Integration, Delivery'}],
    ['opt_1'], 'These are the four properties that guarantee reliable transactions.',
    'ACID stands for Atomicity (all or nothing), Consistency (valid state transitions), Isolation (concurrent transactions don\'t interfere), and Durability (committed data persists).');

  q(transactions, 'easy',
    'What does Atomicity mean in ACID?',
    [{id:'opt_1',text:'Transactions run in parallel'},{id:'opt_2',text:'All operations in a transaction succeed or all fail'},{id:'opt_3',text:'Data is stored permanently'},{id:'opt_4',text:'Transactions are isolated from each other'}],
    ['opt_2'], 'It is an all-or-nothing guarantee.',
    'Atomicity ensures that all operations within a transaction are completed successfully. If any operation fails, the entire transaction is rolled back.');

  q(transactions, 'easy',
    'What is a deadlock?',
    [{id:'opt_1',text:'A transaction that runs too slowly'},{id:'opt_2',text:'Two or more transactions waiting for each other to release locks'},{id:'opt_3',text:'A corrupted database record'},{id:'opt_4',text:'A failed network connection'}],
    ['opt_2'], 'Neither transaction can proceed.',
    'A deadlock occurs when two or more transactions are each waiting for the other to release a lock, creating a circular dependency where none can proceed.');

  q(transactions, 'easy',
    'Which isolation level provides the highest level of isolation?',
    [{id:'opt_1',text:'READ UNCOMMITTED'},{id:'opt_2',text:'READ COMMITTED'},{id:'opt_3',text:'REPEATABLE READ'},{id:'opt_4',text:'SERIALIZABLE'}],
    ['opt_4'], 'It prevents all concurrency anomalies.',
    'SERIALIZABLE is the highest isolation level, ensuring that concurrent transactions produce the same result as if they were executed sequentially.');

  q(transactions, 'easy',
    'What is a dirty read?',
    [{id:'opt_1',text:'Reading data that has been committed'},{id:'opt_2',text:'Reading uncommitted data from another transaction'},{id:'opt_3',text:'Reading data from a backup'},{id:'opt_4',text:'Reading data after a rollback'}],
    ['opt_2'], 'The data may be rolled back by the other transaction.',
    'A dirty read occurs when a transaction reads data that has been modified but not yet committed by another transaction. If the other transaction rolls back, the read data is invalid.');

  await knex('questions').insert(questions);
}
