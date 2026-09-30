/* Lesson markup: [[code]] = inline code, **bold**, lines starting "- " = bullets, "1. " = numbered.
   min = lowest Java version the lesson's code compiles on. */
import { Stage } from '../core/models';

/** Stages 1-4: fundamentals, OOP, core APIs, modern Java. */
export const STAGES_A: Stage[] = [
{id:`fundamentals`,title:`Java fundamentals`,level:`B`,blurb:`How Java runs, types, control flow, arrays, methods and strings.`,lessons:[
{id:`jvm`,t:`How Java runs: JDK, JRE and JVM`,lvl:`B`,
eli5:`Think of the JVM as a universal translator. You write your story once as bytecode, and every country (Windows, macOS, Linux) has its own translator that reads it aloud.`,
body:`Java code goes through two steps. First **javac** compiles your [[.java]] file into **bytecode** ([[.class]] files). Then the **JVM** (Java Virtual Machine) runs that bytecode on any operating system. This is the famous "write once, run anywhere" idea.

- **JVM** runs bytecode and manages memory and garbage collection.
- **JRE** is the JVM plus the core libraries needed to run programs.
- **JDK** is the JRE plus developer tools: [[javac]], [[java]], [[jshell]], [[jar]], [[javadoc]] and a debugger.

As a learner, always install a **JDK**, ideally a current long-term support release such as 25. Since Java 11 there is no separate JRE download from Oracle; you can build slim runtimes with [[jlink]] instead.

Since Java 25 your first program can be a single [[void main()]] method: no class declaration, no [[static]], no [[String[] args]].`,
code:`# Compile, then run (every version)
javac Hello.java
java Hello

# Run a source file directly (Java 11+)
java Hello.java

# Try snippets interactively (Java 9+)
jshell`,lang:`bash`,
old:`public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}`,
neu:`void main() {
    IO.println("Hello, Java!");
}`,oldLabel:`Classic Hello World`,newLabel:`Java 25+ compact source file`,
pro:`The JVM loads classes lazily through a chain of class loaders (bootstrap, platform, application). Bytecode is first interpreted, then hot methods are compiled to native code by the **JIT** compilers: C1 for fast startup, C2 for peak speed. That's why Java services "warm up" after starting. Project Leyden's ahead-of-time caches (Java 24 to 26) record that warm-up work so later runs start faster.`,
trap:`Installing an old Java 8 because a tutorial said so, or forgetting to set JAVA_HOME. Install a current LTS JDK and check with java -version and javac -version.`,
iq:[[`What is the difference between JDK, JRE and JVM?`,`The JVM executes bytecode. The JRE is the JVM plus the standard class library needed to run apps. The JDK is the JRE plus development tools such as javac, jar and jshell.`],
[`Why is Java called platform independent?`,`The compiler produces bytecode, not machine code. Each operating system has its own JVM that runs the same bytecode, so a .class file runs unchanged everywhere. The JVM itself is platform specific.`]],
quiz:[`Which tool turns Hello.java into Hello.class?`,[`java`,`javac`,`jshell`,`jlink`],1,`javac is the compiler. The java command launches the JVM to run the compiled class.`]},

{id:`types`,t:`Variables and data types`,lvl:`B`,min:10,
eli5:`A variable is a labelled box. The type is the box's shape: an int box only fits whole numbers, a String box holds text.`,
body:`Java is **statically typed**: every variable has a type that the compiler checks before the program runs.

There are 8 **primitive** types stored directly as values: [[byte]], [[short]], [[int]], [[long]], [[float]], [[double]], [[char]] and [[boolean]]. Everything else is a **reference** type that points to an object on the heap, such as [[String]], arrays and your own classes.

Each primitive has a **wrapper** class ([[Integer]], [[Double]], [[Boolean]]…) so it can be stored in collections. Java converts between them automatically; this is called **autoboxing** (Java 5).

Since Java 10 you can write [[var]] for local variables and let the compiler infer the type. The type is still fixed at compile time; [[var]] is not dynamic typing.`,
code:`int age = 30;                       // 32-bit whole number
long population = 8_100_000_000L;   // underscores allowed since Java 7
double price = 499.99;
char grade = 'A';
boolean active = true;
String name = "Asha";

Integer boxed = age;                // autoboxing
int back = boxed;                   // unboxing

var cities = new ArrayList<String>();   // Java 10+: inferred as ArrayList<String>
cities.add("Pune");`,
pro:`Local primitives live in the method's stack frame and cost no allocation, while wrappers are heap objects. [[Integer]] caches the values -128 to 127, which is why [[==]] seems to "work" for small numbers and then fails for larger ones. Integer overflow wraps silently: [[Integer.MAX_VALUE + 1]] is negative. Use [[Math.addExact]] or a [[long]] when that matters, and [[BigDecimal]] for money.`,
trap:`Comparing wrapper objects with ==. Integer a = 1000, b = 1000; a == b is false. Use a.equals(b).`,
iq:[[`What is autoboxing and what can go wrong?`,`Automatic conversion between primitives and their wrappers. Pitfalls: NullPointerException when unboxing null, hidden allocations in hot loops, and == comparing references instead of values.`],
[`Is var dynamic typing?`,`No. var is local type inference at compile time. The variable's type is fixed once inferred, and var only works for local variables that have an initializer.`]],
quiz:[`What does Integer a = 128, b = 128; a == b give?`,[`true`,`false`,`Compile error`,`It depends on the OS`],1,`Only -128 to 127 are cached. 128 creates two separate objects, so == compares two different references.`]},

{id:`operators`,t:`Operators and expressions`,lvl:`B`,
eli5:`Operators are the verbs of a calculation: add, compare, combine. Java evaluates them in a fixed order, like the maths rules you learned at school.`,
body:`Java's operators, grouped:
- Arithmetic: [[+ - * / %]]. Integer division drops the fraction, so [[7 / 2]] is 3 and [[7 % 2]] (the remainder) is 1.
- Increment: [[i++]] uses the value and then adds one; [[++i]] adds first.
- Compound assignment: [[+=]], [[-=]], [[*=]]. They also cast back to the variable's type.
- Comparison: [[== != < > <= >=]] produce a [[boolean]].
- Logical: [[&&]] and [[||]] **short-circuit**, so the right side runs only when needed; [[!]] negates.
- Ternary: [[condition ? a : b]] picks one of two values.

Precedence: [[* / %]] before [[+ -]], comparisons before [[&&]], and [[&&]] before [[||]]. When in doubt, add parentheses.

Mixing types promotes to the wider type, so [[int + double]] gives a [[double]]. Going narrower needs a **cast**: [[(int) 3.9]] is 3.`,
code:`int a = 7, b = 2;
System.out.println(a / b);        // 3   (integer division)
System.out.println(a % b);        // 1   (remainder)
System.out.println(a / 2.0);      // 3.5 (double division)

int i = 5;
int x = i++;                      // x = 5, then i becomes 6
int y = ++i;                      // i becomes 7, then y = 7

String user = null;
if (user != null && user.length() > 3) {   // && stops before calling length()
    System.out.println("valid");
}

int marks = 72;
String result = marks >= 40 ? "Pass" : "Fail";
int rounded = (int) 3.99;         // 3: casting truncates
long big = 1_000_000L * 3_000;    // long avoids int overflow`,
pro:`[[&]] and [[|]] on booleans don't short-circuit, so both sides always run. Bitwise operators ([[& | ^ ~ << >> >>>]]) work on the bits of integers and appear in flags, hashing and performance code; [[>>>]] shifts in zeros while [[>>]] keeps the sign. Floating-point maths is approximate: [[0.1 + 0.2]] is [[0.30000000000000004]], which is why money uses [[BigDecimal]].`,
trap:`Writing if (done = true) instead of if (done == true). With booleans it compiles, assigns true, and the branch always runs. Just write if (done).`,
iq:[[`What is the difference between i++ and ++i?`,`i++ returns the old value and then increments; ++i increments first and returns the new value. On a line of their own they behave the same.`],
[`What does short-circuit evaluation mean?`,`With && the right side is skipped if the left side is false; with || it's skipped if the left side is true. It saves work and avoids NullPointerExceptions.`]],
quiz:[`What does 9 / 2 * 2 evaluate to in Java?`,[`9`,`8`,`9.0`,`10`],1,`9 / 2 is 4 (integer division), then 4 * 2 is 8.`]},

{id:`flow`,t:`Control flow and the modern switch`,lvl:`B`,min:14,
eli5:`Code runs top to bottom like a recipe. if and else are forks in the road; switch is a signpost with many arrows.`,
body:`Use [[if]], [[else if]] and [[else]] for conditions, and [[switch]] when one value chooses between many branches.

The classic switch "falls through" to the next case unless you write [[break]], which is a very common bug. Java 14 made **switch expressions** final: arrow labels ([[case X ->]]) never fall through, several labels can share one arm, and the whole switch can **return a value**. Use [[yield]] to return a value from a block arm.

Java 21 went further with **pattern matching** in switch, covered in the Modern Java module.`,
code:`enum Day { MON, TUE, WED, THU, FRI, SAT, SUN }

String type = switch (day) {
    case SAT, SUN -> "Weekend";
    case FRI -> {
        log("Almost there");
        yield "Weekday";
    }
    default -> "Weekday";
};`,
old:`String type;
switch (day) {
    case SAT:
    case SUN:
        type = "Weekend";
        break;          // forget this and you fall through
    default:
        type = "Weekday";
}`,oldLabel:`Before Java 14`,newLabel:`Java 14+ switch expression`,
pro:`The compiler checks switch expressions for **exhaustiveness**. Over an enum with every constant covered, no [[default]] is needed, and adding a new constant later becomes a compile error instead of a silent bug. Strings in switch (Java 7) compile to a switch on [[hashCode()]] followed by an [[equals()]] check.`,
trap:`Mixing arrow labels and colon labels in one switch. That's a compile error, so pick one style.`,
iq:[[`What is the difference between a switch statement and a switch expression?`,`An expression produces a value and must be exhaustive; its arrow labels don't fall through. A statement just runs code and can fall through when it uses colon labels.`],
[`What does yield do?`,`It returns a value from a block arm of a switch expression. It's a contextual keyword, so you can still use yield as a variable name elsewhere.`]],
quiz:[`Which is true for case X -> arms?`,[`They fall through without break`,`They never fall through`,`They always need yield`,`They only work with int`],1,`Arrow arms run only their own code. yield is needed only in block arms that must produce a value.`]},

{id:`arrays`,t:`Loops and arrays`,lvl:`B`,
eli5:`An array is an egg carton with a fixed number of slots, numbered from 0. A loop walks along the carton, slot by slot.`,
body:`Arrays have a **fixed length** set when they are created, and indexes start at 0. Reading index [[arr.length]] throws [[ArrayIndexOutOfBoundsException]].

Java has four loops:
- [[for]] when you need the index.
- **enhanced for** ([[for (T x : items)]], Java 5) to read every element.
- [[while]] when you don't know how many rounds you need.
- [[do-while]] when the body must run at least once.

[[break]] leaves a loop; [[continue]] skips to the next round. For a list that grows, use [[ArrayList]]. For sorting and searching arrays, use the [[Arrays]] utility class.`,
code:`int[] marks = {72, 88, 95, 60};

int total = 0;
for (int m : marks) {          // enhanced for
    total += m;
}
double avg = (double) total / marks.length;

Arrays.sort(marks);            // [60, 72, 88, 95]
System.out.println(Arrays.toString(marks));

int[][] grid = new int[3][3];  // 2D array
grid[1][2] = 5;`,
pro:`Arrays are objects on the heap with a [[length]] field. They are **covariant**: a String array can be assigned to an Object array variable, which can then throw [[ArrayStoreException]] at runtime. Generics are deliberately invariant to avoid exactly this. For hot loops over numbers, a primitive array beats [[List<Integer>]] because there is no boxing.`,
trap:`Printing an array with System.out.println(arr) shows something like [I@1b6d3586. Use Arrays.toString(arr) instead.`,
iq:[[`Can you change an array's size?`,`No, the length is fixed. Create a new array with Arrays.copyOf, or use ArrayList, which does this for you and grows by about 50% when full.`],
[`Array or ArrayList?`,`Arrays: fixed size, can hold primitives, slightly faster. ArrayList: resizable, objects only (so primitives get boxed), a rich API, and works with generics and streams.`]],
quiz:[`What is the last valid index of new int[5]?`,[`5`,`4`,`6`,`0`],1,`Indexes run from 0 to length minus 1.`]},

{id:`methods`,lab:`memory:pass-by-value`,t:`Methods and pass-by-value`,lvl:`B`,
eli5:`A method is a named recipe. You hand it ingredients (arguments), and it may hand you back a dish (the return value).`,
body:`A method has a return type, a name, parameters and a body. Methods with the same name but different parameter lists are **overloaded**.

**Java is always pass-by-value.** For primitives, the value is copied. For objects, the **reference** is copied: the method can change the object's contents, but reassigning the parameter never changes the caller's variable.

[[static]] methods belong to the class, like [[Math.max]]. Instance methods need an object. **Varargs** ([[int... nums]], Java 5) accept any number of arguments.`,
code:`static void rename(StringBuilder sb) {
    sb.append(" Sharma");            // changes the shared object
    sb = new StringBuilder("X");     // only changes the local copy
}

static int sum(int... nums) {        // varargs
    int s = 0;
    for (int n : nums) s += n;
    return s;
}

StringBuilder name = new StringBuilder("Riya");
rename(name);
System.out.println(name);            // Riya Sharma
System.out.println(sum(1, 2, 3));    // 6`,
pro:`Each call pushes a **stack frame** holding parameters and local variables; very deep recursion ends in [[StackOverflowError]]. The JIT inlines small, frequently called methods, so splitting code into small, well-named methods costs nothing at runtime.`,
trap:`Writing swap(int a, int b) and expecting the caller's variables to swap. Only the copies inside the method are swapped.`,
iq:[[`Is Java pass-by-reference for objects?`,`No. It passes a copy of the reference. You can change the object through that copy, but reassigning the parameter never affects the caller's variable.`],
[`Overloading vs overriding?`,`Overloading: same name, different parameters, chosen at compile time. Overriding: a subclass redefines an inherited method with the same signature, chosen at runtime.`]],
quiz:[`A method does list = new ArrayList<>() on its parameter. The caller's list is…`,[`Replaced`,`Unchanged`,`Set to null`,`Cleared`],1,`Only the method's local copy of the reference is reassigned.`]},

{id:`strings`,lab:`memory:string-pool`,t:`Strings, StringBuilder and text blocks`,lvl:`B`,min:15,
eli5:`A String is like text printed on paper: to change it, you print a new page. A StringBuilder is a whiteboard you can keep editing.`,
body:`[[String]] is **immutable**. Methods like [[toUpperCase()]] return a new string and leave the original alone. String literals are kept in the **string pool**, so identical literals share one object.

Always compare text with [[equals()]], never with [[==]].

To build text in a loop, use [[StringBuilder]] (Java 5). It avoids creating a new String on every [[+]].

Handy modern methods: [[isBlank()]], [[strip()]], [[repeat()]] and [[lines()]] (Java 11), [[formatted()]] (Java 15). **Text blocks** ([["""]], final in Java 15) make multi-line JSON, SQL and HTML readable.`,
code:`String a = "java";
String b = new String("java");
System.out.println(a == b);          // false: different objects
System.out.println(a.equals(b));     // true: same text

StringBuilder sb = new StringBuilder();
for (int i = 1; i <= 3; i++) sb.append(i).append(',');
System.out.println(sb);              // 1,2,3,

String json = """
    {
      "course": "Spring Boot",
      "free": true
    }
    """;                             // Java 15+

System.out.println("  hi  ".strip().repeat(2));   // hihi (Java 11+)`,
pro:`Since Java 9, **compact strings** store Latin-1 text in one byte per character, roughly halving memory for most strings. Simple concatenation like [[s1 + s2]] compiles to an [[invokedynamic]] call to [[StringConcatFactory]], so it's fast; only repeated concatenation inside loops is slow. [[intern()]] adds a string to the pool manually.`,
trap:`Using == to compare user input with a literal. It may pass in tests (because literals are pooled) and then fail in production.`,
iq:[[`Why is String immutable?`,`Security (class names, URLs and file paths can't change after being checked), thread safety without locks, safe use as HashMap keys with a cached hashCode, and string pooling.`],
[`String vs StringBuilder vs StringBuffer?`,`String is immutable. StringBuilder is mutable and not synchronized; use it by default. StringBuffer is the older synchronized version and is rarely needed.`]],
quiz:[`What does "hello".toUpperCase() do to the original string?`,[`Changes it`,`Nothing; it returns a new String`,`Throws an exception`,`Empties it`],1,`Strings are immutable. Every "modifying" method returns a new String.`]},

{id:`input`,t:`Reading input and formatting output`,lvl:`B`,
eli5:`A program that can't listen is just a speaker. Scanner is Java's ear for the keyboard, and printf is its neat handwriting.`,
body:`[[System.out.println]] prints a line. For tidy output use **format strings**: [[System.out.printf("%s is %d years old%n", name, age)]].

Common format codes: [[%s]] text, [[%d]] whole numbers, [[%.2f]] a decimal with two places, [[%n]] a new line, [[%,d]] thousands separators, [[%5d]] padding to width 5.

To read input, wrap [[System.in]] in a [[Scanner]]:
- [[nextLine()]] reads a whole line.
- [[nextInt()]] and [[nextDouble()]] read numbers.
- [[hasNextInt()]] checks first, so bad input doesn't crash the program.

[[String.format]] builds a formatted string without printing it; since Java 15 you can also write [["%d items".formatted(n)]]. Since Java 25, [[IO.readln("Your name: ")]] reads a line in one call.`,
code:`import java.util.Scanner;

public class Bill {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);

        System.out.print("Your name: ");
        String name = in.nextLine();

        System.out.print("Items bought: ");
        while (!in.hasNextInt()) {          // keep asking until we get a number
            System.out.print("Please enter a whole number: ");
            in.next();                      // discard the bad input
        }
        int items = in.nextInt();

        double total = items * 249.5;
        System.out.printf("%s, you owe ₹%,.2f for %d items%n", name, total, items);
        // Asha, you owe ₹2,495.00 for 10 items
    }
}`,
pro:`[[nextInt()]] leaves the line break in the buffer, so a following [[nextLine()]] returns an empty string. Call [[nextLine()]] once to consume it, or read every line with [[nextLine()]] and convert with [[Integer.parseInt]]. Formatting follows the default locale; pass a [[Locale]] when output must be machine-readable. Server applications rarely read the keyboard; they read HTTP requests, files and environment variables.`,
trap:`Mixing nextInt() and nextLine() and getting an empty line. Consume the leftover line break, or read lines and parse them.`,
iq:[[`Why does nextLine() return an empty string after nextInt()?`,`nextInt() reads only the digits and leaves the line break; the next nextLine() reads the rest of that same line, which is empty.`],
[`printf vs String.format?`,`printf writes formatted text to the output stream. String.format (or formatted()) returns the formatted String without printing it.`]],
quiz:[`Which format code prints 3.14159 as 3.14?`,[`%d`,`%.2f`,`%s`,`%2d`],1,`%.2f prints a floating-point number with two digits after the decimal point.`]},

{id:`numbers`,t:`Numbers: Math, BigDecimal and random values`,lvl:`B`,min:8,
eli5:`double is a quick sketch of a number: fast, but a little fuzzy at the edges. BigDecimal is an accountant's ledger: slower, but exact to the paisa.`,
body:`The [[Math]] class has the everyday helpers: [[Math.max]], [[Math.min]], [[Math.abs]], [[Math.pow]], [[Math.sqrt]], [[Math.round]], [[Math.floor]] and [[Math.ceil]].

[[double]] stores binary fractions, so some decimals can't be exact: [[0.1 + 0.2 == 0.3]] is false. For **money**, use [[BigDecimal]]:
- Create it from a String, [[new BigDecimal("19.99")]], never from a double.
- It's immutable: [[a.add(b)]] returns a new value.
- Set scale and rounding explicitly: [[setScale(2, RoundingMode.HALF_UP)]].
- Compare with [[compareTo]], because [[2.0]] and [[2.00]] aren't [[equals]].

For random numbers use [[ThreadLocalRandom.current().nextInt(1, 7)]] (a dice roll; 7 is excluded), or [[SecureRandom]] for passwords, OTPs and tokens.

[[Math.addExact]] and [[Math.multiplyExact]] throw an exception instead of silently overflowing.`,
code:`System.out.println(0.1 + 0.2);                    // 0.30000000000000004

BigDecimal price = new BigDecimal("499.99");
BigDecimal gst = price.multiply(new BigDecimal("0.18"))
                      .setScale(2, RoundingMode.HALF_UP);   // 90.00
BigDecimal total = price.add(gst);                 // 589.99

System.out.println(new BigDecimal("2.0").equals(new BigDecimal("2.00")));      // false
System.out.println(new BigDecimal("2.0").compareTo(new BigDecimal("2.00")));   // 0: same value

int dice = ThreadLocalRandom.current().nextInt(1, 7);    // 1 to 6
long ok = Math.multiplyExact(1_000_000L, 5_000L);        // 5,000,000,000
double side = Math.sqrt(Math.pow(3, 2) + Math.pow(4, 2)); // 5.0
int boom = Math.addExact(Integer.MAX_VALUE, 1);           // throws ArithmeticException`,
pro:`Store money as [[NUMERIC(12,2)]] in PostgreSQL, or as whole paise in a [[long]]; payment gateways such as Razorpay take amounts in paise for exactly this reason. [[Math.random()]] and [[new Random()]] are fine for games but predictable, so never use them for OTPs or reset links. [[Math.round(-2.5)]] is -2 because it rounds half up towards positive infinity.`,
trap:`Creating a BigDecimal from a double: new BigDecimal(0.1) is 0.1000000000000000055511151231257827… Use new BigDecimal("0.1") or BigDecimal.valueOf(0.1).`,
iq:[[`Why not use double for money?`,`double stores binary fractions, so values like 0.1 can't be represented exactly and rounding errors add up. BigDecimal, or whole paise in a long, is exact.`],
[`Random vs SecureRandom?`,`Random is fast but predictable from its seed. SecureRandom uses a cryptographically strong source; use it for tokens, passwords and OTPs.`]],
quiz:[`Which correctly checks that two BigDecimal amounts have the same value?`,[`a == b`,`a.equals(b)`,`a.compareTo(b) == 0`,`a.doubleValue() == b.doubleValue()`],2,`compareTo ignores scale, so 2.0 and 2.00 compare as equal; equals also compares the scale.`]},

{id:`recursion`,lab:`memory:recursion`,t:`Recursion`,lvl:`B`,min:16,
eli5:`Recursion is a set of nesting dolls: to open the big doll you open a smaller doll inside it, until you reach the tiny one that doesn't open.`,
body:`A **recursive** method calls itself on a smaller version of the problem. Every recursive method needs:
1. A **base case** that returns without recursing.
2. A **recursive case** that moves towards the base case.

Recursion fits problems that are naturally self-similar: folders inside folders, tree structures, and divide-and-conquer algorithms such as merge sort.

Each call adds a frame to the **call stack**. Too many nested calls, or a missing base case, ends in [[StackOverflowError]]. Java doesn't optimise tail calls, so very deep recursion should become a loop.

Naive recursion can repeat work: the classic Fibonacci recomputes the same values again and again. **Memoization**, remembering results you've already computed, fixes that and leads straight into dynamic programming.`,
code:`static long factorial(int n) {
    if (n <= 1) return 1;              // base case
    return n * factorial(n - 1);       // recursive case
}

static long fib(int n, Map<Integer, Long> memo) {
    if (n <= 1) return n;
    Long cached = memo.get(n);
    if (cached != null) return cached;
    long value = fib(n - 1, memo) + fib(n - 2, memo);
    memo.put(n, value);
    return value;
}

static long folderSize(Path dir) throws IOException {     // natural recursion
    long total = 0;
    try (var entries = Files.list(dir)) {
        for (Path p : entries.toList()) {
            total += Files.isDirectory(p) ? folderSize(p) : Files.size(p);
        }
    }
    return total;
}

System.out.println(factorial(5));               // 120
System.out.println(fib(50, new HashMap<>()));   // 12586269025, instantly`,
pro:`The stack size per thread is set with [[-Xss]] and typically allows a few thousand frames. Any recursion can be rewritten with an explicit stack ([[ArrayDeque]]) and a loop, which is how production code walks very deep trees; [[Files.walk]] does this for directories.`,
trap:`Forgetting the base case, or writing one the recursion never reaches (for example calling fib(n + 1)). The result is StackOverflowError.`,
iq:[[`What causes StackOverflowError?`,`Too many nested method calls, usually infinite or very deep recursion. Each call uses a stack frame and the thread's stack runs out.`],
[`Recursion or iteration?`,`Recursion is clearer for tree-shaped problems; iteration uses constant stack space and is safer for deep inputs, since Java has no tail-call optimisation.`]],
quiz:[`What must every recursive method have?`,[`A loop`,`A base case`,`A static field`,`An int return type`],1,`Without a base case the calls never stop.`]}
]},

{id:`oop`,title:`Object-oriented programming`,level:`B`,blurb:`Classes, the four pillars, interfaces, records, sealed types and the Object contract.`,lessons:[
{id:`classes`,t:`Classes, objects and constructors`,lvl:`B`,
eli5:`A class is a cookie cutter; objects are the cookies. Each cookie has its own sprinkles (field values), but they all share the same shape.`,
body:`A **class** defines state (fields) and behaviour (methods). An **object** is an instance of a class, created with [[new]].

A **constructor** runs when the object is created and has no return type. If you write no constructor, Java adds a no-argument default one. Constructors can call each other with [[this(...)]].

[[this]] refers to the current object. [[static]] fields are shared by every instance of the class.

Since Java 25, **flexible constructor bodies** let you run validation statements before calling [[super(...)]] or [[this(...)]].`,
code:`public class Account {
    private final String owner;
    private double balance;
    private static int count = 0;          // shared by all accounts

    public Account(String owner) {
        this(owner, 0);                    // constructor chaining
    }

    public Account(String owner, double opening) {
        if (opening < 0) throw new IllegalArgumentException("Negative opening balance");
        this.owner = owner;
        this.balance = opening;
        count++;
    }

    public void deposit(double amount) { balance += amount; }
    public double getBalance()         { return balance; }
}

Account acc = new Account("Meera", 500);
acc.deposit(250);`,
pro:`[[new]] allocates memory (usually from a thread-local allocation buffer, which is very cheap), zeroes the fields, runs field initializers and then the constructor chain from [[Object]] downwards. If the JIT proves an object never escapes a method, it may skip the heap allocation entirely (**escape analysis**).`,
trap:`Adding a constructor with parameters removes the automatic no-arg constructor. Frameworks like JPA and Jackson often need one, so add it back (it can be protected).`,
iq:[[`Can a constructor be private?`,`Yes. It's used for singletons, static factory methods such as List.of, and utility classes that should never be instantiated.`],
[`What is constructor chaining?`,`Calling one constructor from another, with this(...) in the same class or super(...) for the parent, so shared setup code lives in one place.`]],
quiz:[`You declare only Account(String owner). What happens to new Account()?`,[`Java still adds a no-arg constructor`,`It fails to compile`,`Fields become static`,`Nothing changes`],1,`The default constructor is added only when you declare no constructors at all.`]},

{id:`static-final`,t:`static, final and constants`,lvl:`B`,min:9,
eli5:`static means "belongs to the whole class", like a school's name that every student shares. final means "can't be changed once set", like a date of birth.`,
body:`**static** members belong to the class rather than to any one object:
- [[static]] fields are shared by every instance (a counter, a cache, a constant).
- [[static]] methods are called on the class, like [[Math.max(a, b)]]. They can't use [[this]] or instance fields.
- A [[static]] block runs once, when the class is loaded.

**final** means "assigned once":
- A [[final]] variable can't be reassigned (the object it points to can still change).
- A [[final]] method can't be overridden.
- A [[final]] class can't be extended; [[String]] is final.

Constants combine both: [[public static final int MAX_SEATS = 60;]], named in UPPER_SNAKE_CASE.

Use static for stateless helpers and constants. Avoid mutable static state: every thread and every test shares it, which makes bugs hard to find.`,
code:`public final class Pricing {                     // final: can't be subclassed
    public static final double GST_RATE = 0.18;   // constant
    private static int quotes = 0;                // shared counter

    private Pricing() {}                          // utility class: no instances

    public static double withGst(double price) {
        quotes++;
        return price * (1 + GST_RATE);
    }

    public static int quotesGiven() { return quotes; }
}

double total = Pricing.withGst(1000);            // called on the class

final List<String> names = new ArrayList<>();
names.add("Asha");                               // allowed: the list itself changes
// names = new ArrayList<>();                    // compile error: can't reassign`,
pro:`Static fields are initialised when the class is first used, and class initialisation is thread-safe, which is why the holder-class singleton works. final fields also get memory-model guarantees: once a constructor finishes, other threads see their values without synchronization. Local variables used in lambdas must be final or effectively final.`,
trap:`Thinking a final reference makes the object immutable. A final List still lets you add and remove items; use List.copyOf for an unmodifiable list.`,
iq:[[`Can a static method access instance variables?`,`Not directly: there's no this in a static context. It needs an object passed in.`],
[`final, finally and finalize?`,`final prevents reassignment, overriding or extension. finally is the block that always runs after try. finalize was an object clean-up hook, deprecated for removal since Java 18.`]],
quiz:[`What does a final class prevent?`,[`Creating objects`,`Being extended`,`Having static methods`,`Changing fields`],1,`No class can extend a final class such as String.`]},

{id:`packages`,t:`Packages, imports and project structure`,lvl:`B`,min:16,
eli5:`Packages are folders for your classes, with a full address, so two classes with the same name never get confused, like two people called Rahul in different cities.`,
body:`A **package** groups related classes and gives them a unique name, like [[com.javaatlas.billing.Invoice]]. The convention is your domain name reversed, then the feature.

- The package declaration is the first line: [[package com.javaatlas.billing;]]
- The folders match it: [[src/main/java/com/javaatlas/billing/Invoice.java]]
- [[import]] lets you use short names: [[import java.util.List;]]. Classes in [[java.lang]] ([[String]], [[Math]]) need no import.
- [[import static]] brings in static members: [[import static java.lang.Math.max;]]

Access levels decide what other packages can see: [[public]] (everyone), [[protected]] (the package and subclasses), no keyword (the package only), [[private]] (the class only).

In Maven and Gradle projects, code lives in [[src/main/java]], tests in [[src/test/java]] and settings in [[src/main/resources]]. Organise packages **by feature** ([[billing]], [[catalog]]) rather than by layer ([[controllers]], [[services]]) so related code stays together.`,
code:`// src/main/java/com/javaatlas/billing/Invoice.java
package com.javaatlas.billing;

import java.math.BigDecimal;
import java.util.List;
import static java.util.Objects.requireNonNull;

public class Invoice {                        // visible everywhere
    private final List<Line> lines;           // visible only inside Invoice

    public Invoice(List<Line> lines) {
        this.lines = List.copyOf(requireNonNull(lines));
    }

    BigDecimal total() {                      // package-private: billing package only
        return lines.stream().map(Line::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}

record Line(String item, BigDecimal amount) {}   // package-private record`,
more:[{cap:`A typical project layout`,lang:`text`,src:`src/main/java/com/javaatlas
├── JavaAtlasApplication.java
├── billing/     Invoice, InvoiceService, InvoiceController
├── catalog/     Course, CourseService, CourseController
└── common/      shared errors and configuration
src/test/java/com/javaatlas/billing/InvoiceServiceTest.java
src/main/resources/application.yml`}],
pro:`Package-private access is underused: keep classes package-private and expose only the few types other features need, and the compiler enforces your boundaries. Modules (Java 9) add a stronger layer, exporting only chosen packages. Wildcard imports compile to the same bytecode as explicit ones; teams usually prefer explicit imports for readability.`,
trap:`Putting the Spring Boot main class in a sub-package. Component scanning starts from its package, so classes in sibling packages aren't found.`,
iq:[[`Why use packages?`,`To group related classes, avoid name clashes, and control visibility with package-private access.`],
[`What is package-private access?`,`The default when no modifier is written: the class or member is visible only inside the same package.`]],
quiz:[`Which package is imported automatically?`,[`java.util`,`java.io`,`java.lang`,`java.time`],2,`java.lang (String, Math, Integer, System) never needs an import.`]},

{id:`pillars`,t:`Encapsulation, inheritance and polymorphism`,lvl:`B`,min:9,
eli5:`Encapsulation is a TV remote: you press buttons without touching the circuits. Inheritance is a child getting a parent's traits. Polymorphism is one Play button that plays music, video or a game depending on the device.`,
body:`**Encapsulation**: keep fields [[private]] and expose behaviour through methods, so each object protects its own rules.

Access levels, from widest to narrowest: [[public]], [[protected]] (same package plus subclasses), package-private (no keyword), [[private]].

**Inheritance**: [[class Car extends Vehicle]] reuses and extends behaviour. A class has one superclass but can implement many interfaces.

**Polymorphism**: a [[Vehicle]] variable can hold a [[Car]] or a [[Bike]], and the overridden method that runs is chosen at **runtime**. Mark overrides with [[@Override]] so the compiler catches typos.`,
code:`abstract class Payment {
    abstract double fee(double amount);
}

class UpiPayment extends Payment {
    @Override double fee(double amount) { return 0; }
}

class CardPayment extends Payment {
    @Override double fee(double amount) { return amount * 0.02; }
}

List<Payment> payments = List.of(new UpiPayment(), new CardPayment());
for (Payment p : payments) {
    System.out.println(p.fee(1000));   // 0.0, then 20.0: runtime dispatch
}`,
pro:`Runtime polymorphism works through a per-class **virtual method table**. The JIT usually removes the cost: if only one implementation is loaded it inlines the call directly, and deoptimizes later if another subclass appears. Prefer **composition over inheritance**; deep hierarchies are brittle because subclasses depend on their parents' internals.`,
trap:`Trying to override a static method. Static methods are hidden, not overridden, so the variable's declared type (not the object) decides which one runs.`,
iq:[[`What are the four pillars of OOP?`,`Encapsulation, abstraction, inheritance and polymorphism.`],
[`Why doesn't Java allow multiple inheritance of classes?`,`To avoid the diamond problem, where two parents define the same method and state. A class can implement several interfaces; if two default methods clash, it must override the method and choose explicitly.`]],
quiz:[`Which modifier allows access from subclasses in other packages?`,[`private`,`package-private`,`protected`,`none of these`],2,`protected means the same package plus subclasses anywhere.`]},

{id:`interfaces`,t:`Interfaces and abstract classes: the basics`,lvl:`I`,min:9,
eli5:`An interface is a job description ("must be able to drive"). An abstract class is a half-built house: some rooms are finished, the rest are left for you.`,
body:`An **interface** declares what a type can do. Since Java 8 it can also contain **default** and **static** methods, and since Java 9 **private** methods that share code between defaults. Fields in interfaces are always [[public static final]] constants.

An **abstract class** can hold instance state, constructors, and a mix of abstract and concrete methods.

Rule of thumb:
- Use an interface to define a capability that unrelated classes can share ([[Comparable]], [[Runnable]]).
- Use an abstract class to share state and code among closely related classes.

An interface with exactly one abstract method is a **functional interface** and can be implemented with a lambda.`,
code:`interface Notifier {
    void send(String to, String msg);

    default void sendAll(List<String> users, String msg) {   // Java 8
        users.forEach(u -> send(u, format(msg)));
    }

    private String format(String msg) {                        // Java 9
        return "[JavaAtlas] " + msg;
    }

    static Notifier console() {                                // Java 8
        return (to, msg) -> System.out.println(to + ": " + msg);
    }
}

Notifier.console().sendAll(List.of("asha", "ravi"), "A new lesson is live");`,
pro:`Default methods were added so the JDK could evolve interfaces like [[Collection]] (adding [[stream()]] and [[forEach]]) without breaking every existing implementation. Conflict rules: a class method always wins over an interface default; between two interfaces, the more specific one wins; otherwise you must override.`,
trap:`Trying to keep per-object state in an interface. Interface fields are static and final, so every implementation shares the same constant.`,
iq:[[`When would you pick an abstract class over an interface today?`,`When subclasses need shared instance state, constructors or non-public members. Otherwise interfaces with default methods are more flexible, because a class can implement many of them.`],
[`Can an interface have a constructor?`,`No. Interfaces cannot be instantiated and have no instance state to initialize.`]],
quiz:[`Since which version can interfaces have private methods?`,[`Java 7`,`Java 8`,`Java 9`,`Java 11`],2,`Default and static methods came in Java 8; private interface methods in Java 9.`]},

{id:`inner`,t:`Nested, inner and anonymous classes`,lvl:`I`,min:9,
eli5:`A nested class is a room inside a house: it belongs there and can use the house's things, but visitors can still be directed to it.`,
body:`Java lets you declare classes inside other classes:
- **Static nested class**: [[static class Builder]] inside [[Pizza]]. It doesn't need an outer object and is the most common kind (builders, private helpers).
- **Inner class** (non-static): each instance is tied to an outer instance and can read its fields.
- **Local class**: declared inside a method; rarely used.
- **Anonymous class**: declared and created in one expression, [[new Comparator<>() { … }]]. Since Java 8 a lambda usually replaces it when the interface has one method.

Rule of thumb: make nested classes [[static]] unless they genuinely need the outer object.`,
code:`public class Pizza {
    private final String size;
    private final List<String> toppings;

    private Pizza(Builder b) {
        this.size = b.size;
        this.toppings = List.copyOf(b.toppings);
    }

    public static class Builder {                   // static nested class
        private String size = "Medium";
        private final List<String> toppings = new ArrayList<>();
        public Builder size(String s) { this.size = s; return this; }
        public Builder topping(String t) { toppings.add(t); return this; }
        public Pizza build() { return new Pizza(this); }
    }
}

Pizza p = new Pizza.Builder().size("Large").topping("Paneer").build();`,
old:`Runnable task = new Runnable() {
    @Override
    public void run() {
        System.out.println("Hi");
    }
};`,
neu:`Runnable task = () -> System.out.println("Hi");`,oldLabel:`Anonymous class`,newLabel:`Lambda (Java 8+)`,
pro:`An inner (non-static) class keeps a hidden reference to its outer object. If the inner instance outlives the outer one (a listener, a callback, a cached task), the outer object can't be garbage collected, a classic memory leak. Anonymous classes compile to separate class files (Outer$1.class); lambdas don't.`,
trap:`Leaving a nested class non-static by default. It silently captures the outer instance, costs memory and can leak it.`,
iq:[[`Static nested vs inner class?`,`A static nested class has no link to an outer instance. An inner class holds a reference to its outer object, can use its fields, and needs an outer instance to be created.`],
[`When is an anonymous class still useful instead of a lambda?`,`When the type has several abstract methods, is an abstract class, or you need fields or a this that refers to the object itself.`]],
quiz:[`How do you create an instance of a static nested class?`,[`outer.new Builder()`,`new Pizza.Builder()`,`Pizza.new Builder()`,`new Builder(outer)`],1,`Static nested classes are created with Outer.Nested and need no outer object.`]},

{id:`enums`,t:`Enums in depth`,lvl:`I`,min:14,
eli5:`An enum is a fixed menu: an order can be PLACED, PAID, SHIPPED or DELIVERED, and nothing else. The compiler won't let you type SHIPED by mistake.`,
body:`An **enum** defines a fixed set of named constants. Each constant is a real object, so enums can have fields, constructors and methods.

- Built-ins: [[values()]], [[valueOf("PAID")]], [[name()]] and [[ordinal()]].
- Enums work in [[switch]], and switch expressions over an enum are checked for completeness.
- Each constant can override a method, giving you the strategy pattern without extra classes.
- [[EnumMap]] and [[EnumSet]] are very fast collections keyed by enum values.
- An enum with one constant is the simplest thread-safe **singleton**.

Store enums in databases by **name**, not by position: [[@Enumerated(EnumType.STRING)]] in JPA. Reordering constants would silently corrupt position-based values.`,
code:`public enum OrderStatus {
    PLACED("Placed"), PAID("Paid"), SHIPPED("On the way"), DELIVERED("Delivered");

    private final String label;
    OrderStatus(String label) { this.label = label; }
    public String label() { return label; }
    public boolean canCancel() { return this == PLACED || this == PAID; }
}

enum Plan {
    FREE { double price() { return 0; } },
    PRO  { double price() { return 499; } };
    abstract double price();                     // each constant implements it
}

String message = switch (status) {               // exhaustive: no default needed
    case PLACED, PAID -> "Preparing your order";
    case SHIPPED -> "On its way";
    case DELIVERED -> "Enjoy!";
};

Map<OrderStatus, Long> counts = new EnumMap<>(OrderStatus.class);
EnumSet<OrderStatus> active = EnumSet.of(OrderStatus.PLACED, OrderStatus.PAID);`,
pro:`Enum constants are created once when the enum class initialises, and the JVM guarantees a single instance per constant even under serialization and reflection, which is why enum singletons are recommended. [[EnumSet]] is a bit vector internally and [[EnumMap]] an array indexed by position, so both beat [[HashSet]] and [[HashMap]] for enum keys.`,
trap:`Storing ordinal() values. Adding a constant in the middle shifts every number after it and corrupts saved data. Store the name.`,
iq:[[`Can enums have constructors?`,`Yes, and they're always private. They run once per constant when the enum class loads.`],
[`Why are enums good singletons?`,`The JVM guarantees one instance per constant, including across serialization and against reflection, with no extra code.`]],
quiz:[`How should JPA store an enum column?`,[`EnumType.ORDINAL`,`EnumType.STRING`,`As bytes`,`It can't`],1,`STRING stores the constant's name, which survives reordering.`]},

{id:`records`,t:`Records, enums and sealed types`,lvl:`I`,min:21,
eli5:`A record is a sealed envelope of data: you write what's inside once, and Java prints the label, the copy rules and the comparison for you. A sealed type is a club with a fixed guest list.`,
body:`**Enums** (Java 5) represent a fixed set of constants and can have fields, constructors and methods.

**Records** (final in Java 16) are transparent, immutable data carriers. One line gives you a constructor, accessor methods, [[equals()]], [[hashCode()]] and [[toString()]]. They're ideal for DTOs, API responses and value objects.

**Sealed classes and interfaces** (final in Java 17) list exactly which types may extend them with [[permits]]. Each permitted subclass must be [[final]], [[sealed]] or [[non-sealed]].

Together, records and sealed interfaces model data precisely, and since Java 21 the compiler can check that a [[switch]] handles every case.`,
code:`enum Plan {
    FREE(0), PRO(499);
    final int priceInr;
    Plan(int price) { this.priceInr = price; }
}

record CourseDto(String title, int lessons, Plan plan) {
    CourseDto {                                   // compact constructor
        if (lessons <= 0) throw new IllegalArgumentException("lessons must be positive");
    }
}

sealed interface Shape permits Circle, Square {}
record Circle(double r) implements Shape {}
record Square(double side) implements Shape {}

double area(Shape s) {
    return switch (s) {                           // exhaustive: no default needed
        case Circle c -> Math.PI * c.r() * c.r();
        case Square q -> q.side() * q.side();
    };
}`,
pro:`Records are [[final]], their fields are [[private final]], and they can't extend other classes (they implicitly extend [[java.lang.Record]]). They're only shallowly immutable: a [[List]] component can still be changed, so copy it with [[List.copyOf]] in the compact constructor. Jackson and Spring MVC bind records out of the box. JPA entities can't be records (entities need a no-arg constructor and mutable state), but records work well as query projections and, since Jakarta Persistence 3.2, as embeddables.`,
trap:`Trying to use a record as a JPA @Entity. Use records for DTOs and projections instead.`,
iq:[[`What does a record generate automatically?`,`A canonical constructor, private final fields, public accessor methods named after the components (with no get prefix), equals, hashCode and toString.`],
[`Why use sealed classes?`,`To restrict a hierarchy to known subtypes, so switches and pattern matching can be checked for exhaustiveness and the domain model can't be extended in unexpected ways.`]],
quiz:[`How do you read the title of record CourseDto(String title, ...)?`,[`dto.getTitle()`,`dto.title()`,`dto.title`,`CourseDto.title()`],1,`Record accessors use the component name with no get prefix.`]},

{id:`object`,t:`equals(), hashCode() and the Object contract`,lvl:`I`,min:16,
eli5:`equals asks "is this the same person?" hashCode says which drawer that person's file is kept in. If two files belong to the same person, they must be in the same drawer.`,
body:`Every class extends [[java.lang.Object]], which provides [[equals()]], [[hashCode()]], [[toString()]], [[getClass()]] and a few more.

By default, [[equals()]] compares references. Override it when two objects holding the same data should count as equal.

**The contract:** if [[a.equals(b)]] is true, then [[a.hashCode() == b.hashCode()]] must also be true. Break it, and [[HashMap]] and [[HashSet]] will lose your objects.

Use [[Objects.equals]] and [[Objects.hash]] (Java 7) to write these safely, or let a **record** generate them for you.`,
code:`public final class Isbn {
    private final String code;
    public Isbn(String code) { this.code = code; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Isbn other)) return false;   // pattern matching, Java 16
        return code.equals(other.code);
    }

    @Override
    public int hashCode() { return Objects.hash(code); }

    @Override
    public String toString() { return "Isbn[" + code + "]"; }
}

Set<Isbn> set = new HashSet<>();
set.add(new Isbn("978-0134685991"));
System.out.println(set.contains(new Isbn("978-0134685991")));   // true`,
pro:`For JPA entities this gets subtle: a generated id is null before the entity is saved, so a hash based on the id changes after persisting. Common approaches are a natural business key, or id-based equals with a constant [[hashCode()]] such as [[getClass().hashCode()]]. Never include lazy associations in equals, hashCode or toString; that triggers extra queries or [[LazyInitializationException]].`,
trap:`Overriding equals but not hashCode. Two equal objects land in different HashMap buckets and contains() returns false.`,
iq:[[`What happens if you override equals without hashCode?`,`Hash-based collections break: equal objects can get different hash codes, land in different buckets, and lookups fail or a HashSet stores duplicates.`],
[`Can two unequal objects have the same hashCode?`,`Yes. That's a collision and it's allowed; it only costs some performance. The reverse, equal objects with different hash codes, is forbidden.`]],
quiz:[`If a.equals(b) is true, which must also be true?`,[`a == b`,`a.hashCode() == b.hashCode()`,`a.toString().equals(b.toString())`,`a and b are the same instance`],1,`Equal objects must have equal hash codes. None of the other statements is required.`]},

{id:`immutability`,t:`Immutable objects`,lvl:`I`,min:16,
eli5:`An immutable object is a printed receipt: once issued, nobody can change the amount. For a different amount, you issue a new receipt.`,
body:`An **immutable** object can't change after it's created. [[String]], [[Integer]], [[LocalDate]] and [[BigDecimal]] are all immutable.

Why it's worth it:
- **Thread-safe** without locks: nothing changes, so nothing can race.
- Safe as [[HashMap]] keys and in sets, because the hash never changes.
- Easier to reason about: nobody can modify it behind your back.

How to make a class immutable:
1. Make fields [[private final]] and set them in the constructor.
2. Provide no setters; "changes" return a new object, such as [[withPrice(…)]].
3. Make the class [[final]], or use a **record**.
4. Make **defensive copies** of mutable inputs and outputs ([[List.copyOf]]), or a caller can still change your list.`,
code:`public record Cart(String owner, List<String> items) {
    public Cart {
        items = List.copyOf(items);                 // defensive copy, unmodifiable
    }

    public Cart add(String item) {                  // returns a new Cart
        var next = new ArrayList<>(items);
        next.add(item);
        return new Cart(owner, next);
    }
}

List<String> source = new ArrayList<>(List.of("Java book"));
Cart cart = new Cart("Asha", source);
source.add("Hack!");                                // doesn't affect cart
Cart bigger = cart.add("Spring book");              // the original stays the same
System.out.println(cart.items());                   // [Java book]
// cart.items().add("x");                           // UnsupportedOperationException`,
pro:`Immutability trades a little allocation for a lot of simplicity. Modern JVMs make short-lived objects cheap, so this rarely matters outside hot loops, where a mutable builder such as [[StringBuilder]] is the escape hatch. [[Collections.unmodifiableList]] is only a read-only view, and changes to the underlying list still show through; [[List.copyOf]] makes a real copy.`,
trap:`Returning an internal mutable list from a getter. Callers can then change your object's state; return an unmodifiable copy.`,
iq:[[`How do you make a class immutable?`,`Private final fields set in the constructor, no setters, a final class, defensive copies of mutable fields going in and out, and methods that return new instances for changes.`],
[`unmodifiableList vs List.copyOf?`,`unmodifiableList wraps the original, so changes to it still show through. List.copyOf creates an independent unmodifiable copy and rejects nulls.`]],
quiz:[`Which of these is not immutable?`,[`String`,`LocalDate`,`ArrayList`,`BigDecimal`],2,`An ArrayList can be changed after it's created.`]}
]},

{id:`core`,title:`Core APIs`,level:`I`,blurb:`Exceptions, collections, HashMap internals, generics and java.time.`,lessons:[
{id:`exceptions`,t:`Exception handling`,lvl:`I`,min:7,
eli5:`An exception is a fire alarm. try is the building, catch is the fire team, and finally is locking the doors on the way out, whether there was a fire or not.`,
body:`All errors extend [[Throwable]]:
- [[Error]]: serious JVM problems such as [[OutOfMemoryError]]. Don't catch these.
- **Checked** exceptions ([[IOException]], [[SQLException]]): the compiler forces you to catch or declare them.
- **Unchecked** exceptions ([[RuntimeException]] and subclasses such as [[NullPointerException]] and [[IllegalArgumentException]]): usually programming bugs.

**try-with-resources** (Java 7) closes anything that implements [[AutoCloseable]], even when an exception is thrown. **Multi-catch** ([[catch (A | B e)]]) handles several exception types in one block.

Since Java 14, **helpful NullPointerExceptions** tell you exactly which variable or call was null.`,
code:`public String firstLine(Path file) {
    try (BufferedReader reader = Files.newBufferedReader(file)) {   // closed automatically
        return reader.readLine();
    } catch (NoSuchFileException | AccessDeniedException e) {
        throw new CourseFileException("Cannot open " + file, e);    // keep the cause
    } catch (IOException e) {
        throw new UncheckedIOException(e);
    }
}

class CourseFileException extends RuntimeException {
    CourseFileException(String msg, Throwable cause) { super(msg, cause); }
}`,
old:`BufferedReader reader = null;
try {
    reader = new BufferedReader(new FileReader(file));
    return reader.readLine();
} finally {
    if (reader != null) {
        try { reader.close(); } catch (IOException ignored) { }
    }
}`,oldLabel:`Before Java 7`,newLabel:`Java 7+ try-with-resources`,
pro:`If both the try block and [[close()]] throw, the close exception is attached as a **suppressed** exception ([[getSuppressed()]]) instead of hiding the original. Creating exceptions is relatively expensive because of the stack trace, so use them for exceptional cases, not normal control flow. In Spring, [[@Transactional]] rolls back on unchecked exceptions by default but **not** on checked ones unless you set [[rollbackFor]].`,
trap:`Writing catch (Exception e) { } and silently swallowing the error. At minimum log it; usually rethrow it wrapped, with the original as the cause.`,
iq:[[`Checked vs unchecked exceptions?`,`Checked exceptions extend Exception (but not RuntimeException) and must be caught or declared; they model recoverable conditions like I/O failures. Unchecked exceptions extend RuntimeException, need no declaration, and usually signal bugs.`],
[`Does finally always run?`,`Almost always: after a return, a break or an exception. It doesn't run if the JVM exits (System.exit), crashes, or the thread is killed.`]],
quiz:[`Which interface must a resource implement to be used in try-with-resources?`,[`Closeable only`,`AutoCloseable`,`Serializable`,`Runnable`],1,`AutoCloseable. Closeable extends it, so Closeable types work too.`]},

{id:`collections`,t:`Collections framework: choosing the right one`,lvl:`I`,min:21,
eli5:`A List is a queue at a ticket counter: order matters and duplicates are allowed. A Set is a guest list with no duplicates. A Map is a phone book from name to number.`,
body:`The core interfaces:
- [[List]]: ordered, allows duplicates. Default choice: [[ArrayList]]. [[LinkedList]] is rarely better.
- [[Set]]: no duplicates. [[HashSet]] (fast, no order), [[LinkedHashSet]] (insertion order), [[TreeSet]] (sorted).
- [[Map]]: key to value. [[HashMap]], [[LinkedHashMap]], [[TreeMap]], and [[ConcurrentHashMap]] when several threads share it.
- [[Queue]] and [[Deque]]: [[ArrayDeque]] for stacks and queues, [[PriorityQueue]] for "smallest first".

Java 9 added immutable factories: [[List.of]], [[Set.of]] and [[Map.of]]. Java 21 added **sequenced collections**: [[getFirst()]], [[getLast()]] and [[reversed()]] on lists, deques and ordered sets and maps.`,
code:`List<String> topics = new ArrayList<>(List.of("Spring", "JPA", "Java"));
topics.add("Kafka");
Collections.sort(topics);                  // [JPA, Java, Kafka, Spring]

Set<String> tags = new TreeSet<>(Set.of("jvm", "api", "orm"));   // sorted
Map<String, Integer> views = new HashMap<>();
views.merge("streams", 1, Integer::sum);   // count occurrences
int records = views.getOrDefault("records", 0);

Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);
stack.push(2);
stack.pop();                               // 2

System.out.println(topics.getFirst());     // Java 21+: JPA
System.out.println(topics.reversed());     // Java 21+: [Spring, Kafka, Java, JPA]`,
pro:`Big-O cheat sheet: [[ArrayList]] get is O(1), add at the end is amortized O(1), insert in the middle is O(n). [[HashMap]] get and put are O(1) on average; [[TreeMap]] is O(log n). [[LinkedList]] has O(n) access and poor cache locality, so [[ArrayDeque]] beats it even as a queue. [[List.of]] collections reject nulls and throw [[UnsupportedOperationException]] if you try to modify them.`,
trap:`Removing items inside a for-each loop throws ConcurrentModificationException. Use list.removeIf(...) or an Iterator's remove().`,
iq:[[`ArrayList vs LinkedList?`,`ArrayList is backed by an array: fast random access and cache friendly, with amortized resizing. LinkedList has O(n) access and more memory per element, and only wins for frequent inserts and removals through an iterator, which is rare in practice.`],
[`HashSet vs LinkedHashSet vs TreeSet?`,`HashSet: O(1), no order. LinkedHashSet: O(1), keeps insertion order. TreeSet: O(log n), sorted by natural order or a Comparator.`]],
quiz:[`Which structure keeps its keys sorted?`,[`HashMap`,`LinkedHashMap`,`TreeMap`,`ConcurrentHashMap`],2,`TreeMap is a red-black tree ordered by key.`]},

{id:`lists-sets-queues`,t:`Every List, Set and Queue: ArrayList to BlockingQueue`,lvl:`I`,min:21,
eli5:`Pick the container by the question you'll ask most: "what's at position 5?" (list), "have I seen this before?" (set), or "who's next?" (queue).`,
body:`**Lists** keep insertion order and allow duplicates.
- [[ArrayList]]: fast access by position; the default choice.
- [[List.of(…)]]: fixed and unmodifiable, ideal for constants.

**Sets** reject duplicates.
- [[HashSet]]: fastest, no order.
- [[LinkedHashSet]]: remembers insertion order.
- [[TreeSet]]: sorted, with [[first()]], [[ceiling(x)]] and [[headSet(x)]].

**Queues and deques** hand out items in order.
- [[ArrayDeque]]: a queue (FIFO with [[offer]] and [[poll]]) or a stack (LIFO with [[push]] and [[pop]]).
- [[PriorityQueue]]: always gives the smallest, or highest-priority, item next.

Remove items safely with [[removeIf]] or an [[Iterator]]. Java 21's sequenced collections add [[getFirst()]], [[getLast()]] and [[reversed()]] to lists, deques and ordered sets.`,
code:`List<String> names = new ArrayList<>(List.of("Ravi", "Asha", "Kabir", "Asha"));
names.removeIf(n -> n.startsWith("K"));
Set<String> unique = new LinkedHashSet<>(names);        // [Ravi, Asha]

TreeSet<Integer> scores = new TreeSet<>(List.of(55, 72, 91, 38));
System.out.println(scores.ceiling(60));                 // 72: the smallest value >= 60
System.out.println(scores.headSet(60));                 // [38, 55]

Deque<String> history = new ArrayDeque<>();             // a browser's back button
history.push("/home");
history.push("/courses");
history.push("/courses/java");
history.pop();                                          // back to /courses

record Job(String name, int priority) {}
PriorityQueue<Job> jobs = new PriorityQueue<>(Comparator.comparingInt(Job::priority).reversed());
jobs.add(new Job("email", 1));
jobs.add(new Job("payment", 10));
System.out.println(jobs.poll().name());                 // payment

System.out.println(names.getLast());                    // Java 21+`,
pro:`Iterating a [[PriorityQueue]] doesn't give sorted order; only repeated [[poll()]] does, because it's a binary heap (O(log n) insert and poll, O(1) peek). [[ArrayDeque]] rejects [[null]] because [[null]] means "empty" from [[poll()]]. For thread-safe hand-offs between threads, use a [[BlockingQueue]] such as [[LinkedBlockingQueue]].`,
trap:`Using Stack or LinkedList as a stack. Stack is a synchronized legacy class; ArrayDeque is faster and recommended.`,
iq:[[`How does PriorityQueue order its elements?`,`It's a binary min-heap ordered by natural order or a Comparator. peek is O(1), offer and poll are O(log n), and iteration order is not sorted.`],
[`Queue vs Deque?`,`A Queue adds at the tail and removes from the head (FIFO). A Deque works at both ends, so it can act as a queue or a stack.`]],
quiz:[`Which class is recommended for a stack?`,[`Stack`,`Vector`,`ArrayDeque`,`TreeSet`],2,`ArrayDeque's push and pop are fast and unsynchronized.`]},

{id:`comparing`,t:`Sorting objects: Comparable and Comparator`,lvl:`I`,min:16,
eli5:`Comparable is an object's own sense of order, like students ranked by roll number. A Comparator is a judge you bring in for a different contest: rank by marks, then by name.`,
body:`To sort your own objects, Java needs to know how two of them compare.

**Comparable** gives a class its **natural order** by implementing [[compareTo]]: return a negative number if this comes first, zero if equal, positive if after. [[String]], [[Integer]] and [[LocalDate]] already implement it.

**Comparator** defines an order from outside the class, so you can have many. Java 8's factory methods keep them readable:
- [[Comparator.comparing(Student::name)]]
- [[.thenComparing(…)]] for tie-breakers
- [[.reversed()]] and [[Comparator.comparingInt(…)]] (no boxing)
- [[Comparator.nullsLast(…)]] when values can be null

Sort with [[list.sort(comparator)]] or [[stream.sorted(comparator)]]. Sorting is **stable**: equal elements keep their relative order.`,
code:`record Student(String name, int marks, LocalDate joined) implements Comparable<Student> {
    @Override
    public int compareTo(Student other) {             // natural order: by name
        return name.compareTo(other.name);
    }
}

List<Student> list = new ArrayList<>(List.of(
    new Student("Ravi", 81, LocalDate.of(2025, 6, 1)),
    new Student("Asha", 92, LocalDate.of(2025, 1, 15)),
    new Student("Kabir", 81, LocalDate.of(2024, 11, 3))));

Collections.sort(list);                               // Asha, Kabir, Ravi

list.sort(Comparator.comparingInt(Student::marks).reversed()
                    .thenComparing(Student::joined));
// Asha (92), then Kabir (81, joined earlier), then Ravi (81)

Student top = Collections.max(list, Comparator.comparingInt(Student::marks));`,
pro:`Keep [[compareTo]] consistent with [[equals]]: if [[compareTo]] returns 0 for objects that aren't equal, [[TreeSet]] and [[TreeMap]] treat them as duplicates and keep only one. Never compare with subtraction ([[a - b]]), which overflows for large or negative values; use [[Integer.compare(a, b)]]. [[List.sort]] uses TimSort, which is stable and fast on partly sorted data.`,
trap:`Writing compare as return a.marks() - b.marks(). It can overflow and give wrong results; use Integer.compare or Comparator.comparingInt.`,
iq:[[`Comparable vs Comparator?`,`Comparable defines one natural order inside the class (compareTo). Comparator defines any number of external orders (compare) and can be combined with thenComparing and reversed.`],
[`What happens if compareTo is inconsistent with equals?`,`Sorted collections such as TreeSet use compareTo to decide equality, so they may drop elements that equals considers different.`]],
quiz:[`What should compareTo return when this should come before other?`,[`0`,`A positive number`,`A negative number`,`true`],2,`Negative means this sorts first, positive means after, zero means equal.`]},

{id:`hashmap`,lab:`hashmap:fruits`,t:`How HashMap works inside`,lvl:`A`,min:9,
eli5:`Imagine a row of 16 lockers. The key's hash tells you which locker to use. If two keys pick the same locker, they share it in a small chain.`,
body:`[[HashMap]] stores entries in an array of **buckets**.

1. [[put(k, v)]] computes [[k.hashCode()]], mixes the high bits into the low bits, then picks a bucket with [[hash & (n - 1)]].
2. If the bucket is empty, the entry goes in. Otherwise Java walks the bucket comparing keys with [[equals()]]: the same key means the value is replaced, a new key is appended.
3. Since **Java 8**, when a new entry is added to a bucket that already holds 8, the bucket becomes a **red-black tree** (if the table has at least 64 buckets; otherwise it resizes), so worst-case lookup is O(log n) instead of O(n).
4. When the size passes **capacity × load factor** (16 × 0.75 = 12 by default), the table doubles and the entries are redistributed.

One [[null]] key is allowed. [[HashMap]] is not thread-safe.

Want to see every step? The **HashMap internals** stage is a 13-part series with an interactive lab.`,
code:`Map<String, Integer> stock = new HashMap<>(64);    // presize if you know roughly how many

stock.put("java-book", 10);
stock.put("java-book", 12);                        // same key: value replaced
stock.computeIfAbsent("spring-book", k -> 5);
stock.computeIfPresent("java-book", (k, v) -> v - 1);

// Why keys must not change after insertion:
List<String> key = new ArrayList<>(List.of("a"));
Map<List<String>, String> m = new HashMap<>();
m.put(key, "value");
key.add("b");                                      // hashCode changes
System.out.println(m.get(key));                    // null: the entry is stranded`,
pro:`A power-of-two capacity makes [[& (n - 1)]] a fast modulo, and the hash spreading step ([[h ^ (h >>> 16)]]) compensates for weak hashCodes. During a resize in Java 8+, each entry either stays at index i or moves to i + oldCapacity, so nothing is rehashed. In Java 7, concurrent resizing could create a cycle in a bucket and hang a thread forever, one reason to use [[ConcurrentHashMap]], which locks per bucket (CAS plus synchronized on the first node) and forbids null keys and values.`,
trap:`Using a mutable object as a key and changing it after insertion. The entry becomes unreachable.`,
iq:[[`What happens when two keys have the same hashCode?`,`They go into the same bucket, stored as a linked list, or a tree once there are 8 or more entries in Java 8+. get() walks the bucket and uses equals() to find the matching key.`],
[`Why is the default load factor 0.75?`,`It balances memory against collisions. A higher value saves space but makes chains longer; a lower one wastes space. 0.75 keeps average chains very short.`]],
quiz:[`In Java 8+, what does a crowded bucket turn into?`,[`An array`,`A red-black tree`,`A skip list`,`A new HashMap`],1,`A bucket that already holds 8 nodes is treeified on the next insert (when the table has at least 64 buckets) for O(log n) worst-case lookups.`]},

{id:`maps`,t:`Every Map: HashMap, LinkedHashMap, TreeMap, Hashtable and ConcurrentHashMap`,lvl:`I`,min:9,
eli5:`A map is a dictionary: look up a word (the key) to get its meaning (the value). Different maps are different kinds of dictionary: unordered, in the order words were added, or alphabetical.`,
body:`Choosing a map:
- [[HashMap]]: fastest, no order. The default.
- [[LinkedHashMap]]: keeps insertion order, or access order for caches.
- [[TreeMap]]: sorted by key, with range queries like [[floorKey]], [[ceilingEntry]] and [[headMap]].
- [[ConcurrentHashMap]]: safe for many threads.
- [[Map.of(…)]]: small, fixed and unmodifiable.

Modern methods that remove boilerplate:
- [[getOrDefault(key, fallback)]]
- [[computeIfAbsent(key, k -> new ArrayList<>())]] for grouping
- [[merge(key, 1, Integer::sum)]] for counting
- [[entrySet()]] to loop over keys and values together

[[LinkedHashMap]] can even be a tiny **LRU cache**: turn on access order and override [[removeEldestEntry]].`,
code:`Map<String, Integer> wordCount = new HashMap<>();
for (String w : "to be or not to be".split(" ")) {
    wordCount.merge(w, 1, Integer::sum);             // {to=2, be=2, or=1, not=1}
}

Map<String, List<String>> byCity = new HashMap<>();
byCity.computeIfAbsent("Pune", k -> new ArrayList<>()).add("Asha");

TreeMap<Integer, String> tiers = new TreeMap<>(Map.of(0, "Bronze", 1000, "Silver", 5000, "Gold"));
System.out.println(tiers.floorEntry(3200).getValue());   // Silver

class LruCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    LruCache(int capacity) {
        super(16, 0.75f, true);                          // true = access order
        this.capacity = capacity;
    }
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;
    }
}

for (Map.Entry<String, Integer> e : wordCount.entrySet()) {
    System.out.println(e.getKey() + " = " + e.getValue());
}`,
pro:`Looping over [[keySet()]] and calling [[get()]] does two lookups per entry; loop over [[entrySet()]] instead. [[HashMap]] allows one null key, while [[ConcurrentHashMap]], [[Map.of]] and a naturally ordered [[TreeMap]] reject null keys. For a real cache with expiry and size limits, use Caffeine or Spring's cache support rather than a hand-made LRU.`,
trap:`Using a mutable object as a key and changing it after putting it in. The entry becomes unreachable.`,
iq:[[`HashMap vs LinkedHashMap vs TreeMap?`,`HashMap: O(1), no order. LinkedHashMap: O(1), insertion or access order. TreeMap: O(log n), sorted by key with range queries.`],
[`How would you build an LRU cache in Java?`,`Extend LinkedHashMap with access order turned on and override removeEldestEntry to return true when the size passes the capacity.`]],
quiz:[`Which method counts occurrences in one call?`,[`put`,`merge`,`get`,`containsKey`],1,`merge(key, 1, Integer::sum) starts at 1 or adds 1 to the current count.`]},

{id:`generics`,t:`Generics and wildcards`,lvl:`I`,min:9,
eli5:`Generics are labels on jars. A jar labelled "cookies" only accepts cookies, so you never reach in and pull out a pickle by surprise.`,
body:`Generics (Java 5) let classes and methods work with any type while keeping **compile-time type safety**: no casts and no surprise [[ClassCastException]].

- Generic class: [[class Box<T>]]
- Generic method: [[static <T> T first(List<T> list)]]
- Bounded type: [[<T extends Number>]]
- Diamond operator (Java 7): [[new ArrayList<>()]]

**Wildcards** follow the PECS rule, **Producer Extends, Consumer Super**:
- [[List<? extends Number>]]: you can read Numbers from it (it produces values).
- [[List<? super Integer>]]: you can add Integers to it (it consumes values).`,
code:`class Box<T> {
    private final T value;
    Box(T value) { this.value = value; }
    T get() { return value; }
}

static <T extends Comparable<T>> T max(List<T> items) {
    T best = items.get(0);
    for (T t : items) if (t.compareTo(best) > 0) best = t;
    return best;
}

static double total(List<? extends Number> nums) {    // producer: read from it
    double sum = 0;
    for (Number n : nums) sum += n.doubleValue();
    return sum;
}

static void fill(List<? super Integer> sink) {        // consumer: write to it
    sink.add(1);
    sink.add(2);
}

Box<String> b = new Box<>("hi");
System.out.println(max(List.of(3, 9, 4)));            // 9`,
pro:`Generics use **type erasure**: [[List<String>]] and [[List<Integer>]] are the same class at runtime, so you can't write [[new T()]], [[T.class]] or [[instanceof List<String>]]. Frameworks recover type information from class signatures instead, for example Jackson's [[TypeReference]] or Spring's [[ParameterizedTypeReference]], which use an anonymous subclass so the type argument is recorded.`,
trap:`Using raw types such as List list = new ArrayList(); You lose type checking and get unchecked warnings. Always give the type argument.`,
iq:[[`What is type erasure?`,`The compiler checks generic types and then removes them, inserting casts where needed. At runtime the type arguments don't exist, which keeps bytecode compatible with pre-Java 5 code.`],
[`Explain PECS.`,`Producer Extends, Consumer Super: use ? extends T when you only read T values from a structure, and ? super T when you only write T values into it.`]],
quiz:[`Which list can you safely add an Integer to?`,[`List<? extends Number>`,`List<? super Integer>`,`List<?>`,`None of them`],1,`? super Integer guarantees the list accepts Integers.`]},

{id:`datetime`,t:`java.time: dates done right`,lvl:`I`,min:8,
eli5:`The old Date class was a wristwatch anyone could reset. java.time gives you separate, sealed tools: a calendar, a wall clock, a stopwatch and a world clock.`,
body:`Java 8 introduced [[java.time]] to replace the mutable, confusing [[Date]] and [[Calendar]]. Every class is **immutable** and thread-safe.

- [[LocalDate]]: a date with no time, like a birthday.
- [[LocalDateTime]]: date and time with no zone.
- [[ZonedDateTime]]: date and time in a zone such as [[Asia/Kolkata]].
- [[Instant]]: a point on the UTC timeline. Store this for timestamps.
- [[Duration]] (hours, seconds) and [[Period]] (days, months, years).
- [[DateTimeFormatter]]: thread-safe formatting, unlike the old [[SimpleDateFormat]].

Rule of thumb for backends: store an [[Instant]] (or [[timestamptz]] in PostgreSQL) and convert to the user's zone only for display.`,
code:`LocalDate today = LocalDate.now();
LocalDate due = today.plusDays(30);
long days = ChronoUnit.DAYS.between(today, due);            // 30

Instant createdAt = Instant.now();                           // store this in the DB
ZonedDateTime ist = createdAt.atZone(ZoneId.of("Asia/Kolkata"));

DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
System.out.println(ist.format(fmt));                         // e.g. 24 Sep 2026, 10:15 AM

Period age = Period.between(LocalDate.of(1995, 5, 20), today);
Duration timeout = Duration.ofSeconds(30);`,
pro:`JPA 2.2 and Hibernate map [[LocalDate]], [[LocalDateTime]] and [[Instant]] natively, with no converters needed. Inject a [[Clock]] into services instead of calling [[now()]] directly, so tests can freeze time with [[Clock.fixed(...)]].`,
trap:`Using LocalDateTime for event timestamps. It has no zone, so the same value means different moments on servers in different regions.`,
iq:[[`Why was java.time introduced?`,`Date and Calendar were mutable, not thread-safe, had 0-based months and confusing time-zone handling. java.time is immutable, clearly named and based on ISO-8601; it was designed after Joda-Time.`],
[`Instant vs LocalDateTime?`,`An Instant is an exact moment on the UTC timeline. A LocalDateTime is a wall-clock reading with no zone, so it isn't a specific moment until you attach a zone.`]],
quiz:[`Which type should store "when was this order created"?`,[`LocalDate`,`LocalDateTime`,`Instant`,`String`],2,`An Instant is an unambiguous point in time.`]},

{id:`io`,t:`Files and I/O with NIO.2`,lvl:`I`,min:11,
eli5:`Path is the address of a file; Files is the postman who reads, writes, copies and moves things at that address.`,
body:`Modern file code uses [[java.nio.file]] (Java 7+):
- [[Path.of("data", "orders.csv")]] builds a path that works on every operating system.
- [[Files.readString(path)]] and [[Files.writeString(path, text)]] (Java 11) for small files.
- [[Files.lines(path)]] streams large files lazily, one line at a time.
- [[Files.newBufferedReader]] and [[Files.newBufferedWriter]] for line-by-line control.
- [[Files.copy]], [[Files.move]], [[Files.delete]] and [[Files.createDirectories]].
- [[Files.walk(dir)]] visits a whole folder tree.

UTF-8 is the default charset since Java 18. Close streams with try-with-resources: [[Files.lines]] and [[Files.walk]] hold an open file handle until closed.

The older [[java.io.File]] class still works but reports errors poorly, often by returning [[false]]; prefer [[Path]] and [[Files]].`,
code:`Path dir = Path.of("reports");
Files.createDirectories(dir);

Path file = dir.resolve("summary.txt");
Files.writeString(file, "Total orders: 42\n");                        // Java 11+
Files.writeString(file, "Refunds: 3\n", StandardOpenOption.APPEND);
String text = Files.readString(file);

Path csv = Path.of("orders.csv");
try (Stream<String> lines = Files.lines(csv)) {                       // lazy, closed after use
    double revenue = lines.skip(1)                                    // skip the header row
        .map(line -> line.split(","))
        .mapToDouble(cols -> Double.parseDouble(cols[2]))
        .sum();
    System.out.println(revenue);
}

try (Stream<Path> tree = Files.walk(Path.of("src"))) {
    long javaFiles = tree.filter(p -> p.toString().endsWith(".java")).count();
}`,
pro:`[[Files.lines]] reads one line at a time, so a 5 GB log never loads into memory. For real CSV files use a library (Apache Commons CSV, OpenCSV), because quoted fields can contain commas. In web apps that run several instances, don't save user uploads to one server's disk; use object storage such as S3.`,
trap:`Forgetting to close Files.lines or Files.walk. Each keeps a file handle open until closed; use try-with-resources.`,
iq:[[`java.io.File vs java.nio.file.Path?`,`Path with Files gives clear exceptions, symbolic-link support, file attributes, watch services and stream methods. File returns booleans on failure and lacks many features.`],
[`How do you read a huge file without running out of memory?`,`Stream it line by line with Files.lines or a BufferedReader inside try-with-resources, instead of reading it all at once.`]],
quiz:[`Which reads a large file lazily, line by line?`,[`Files.readString`,`Files.readAllLines`,`Files.lines`,`Files.readAllBytes`],2,`Files.lines returns a lazy Stream<String>; remember to close it.`]},

{id:`regex`,t:`Regular expressions`,lvl:`I`,
eli5:`A regular expression is a search pattern, like describing a mobile number as "ten digits starting with 6 to 9", instead of listing every possible number.`,
body:`Regex describes text patterns. In Java, use [[Pattern]] and [[Matcher]], or String helpers.

Building blocks:
- [[\d]] a digit, [[\w]] a letter, digit or underscore, [[\s]] whitespace, [[.]] any character
- [[[a-z]]] a range, [[[^0-9]]] anything except digits
- Quantifiers: [[*]] zero or more, [[+]] one or more, [[?]] optional, [[{10}]] exactly ten, [[{2,5}]] two to five
- Anchors: [[^]] start, [[$]] end
- Groups: [[(…)]] captures a part; [[(?<name>…)]] names it

Java strings need a double backslash, so the digit class is written [["\\\\d"]] in code.

Useful methods: [[matches()]] (the whole string), [[find()]] (search), [[replaceAll]] and [[split]]. Compile a [[Pattern]] once and reuse it; compiling is the expensive part.`,
code:`import java.util.regex.*;

Pattern MOBILE = Pattern.compile("^(\\\\+91)?[6-9]\\\\d{9}$");
System.out.println(MOBILE.matcher("+919876543210").matches());    // true

Pattern ORDER = Pattern.compile("ORD-(?<year>\\\\d{4})-(?<num>\\\\d+)");
Matcher m = ORDER.matcher("Refund for ORD-2026-00451 and ORD-2025-9");
while (m.find()) {
    System.out.println(m.group("year") + " / " + m.group("num"));
}
// 2026 / 00451
// 2025 / 9

String clean = "  Hello,   Java   world ".trim().replaceAll("\\\\s+", " ");   // "Hello, Java world"
String[] tags = "java, spring ,jpa".split("\\\\s*,\\\\s*");                    // [java, spring, jpa]
boolean strong = "Secret123!".matches("(?=.*\\\\d)(?=.*[A-Z]).{8,}");`,
pro:`[[String.matches]] compiles a new pattern on every call, so keep patterns you reuse in [[static final]] fields. Nested quantifiers such as [[(a+)+$]] can take exponential time on crafted input (a ReDoS attack), so keep patterns on user input simple. For email addresses, a simple pattern plus a confirmation email beats a giant regex.`,
trap:`Splitting on a dot with split("."). A dot means "any character" in regex; escape it as split("\\\\.").`,
iq:[[`matches() vs find()?`,`matches() requires the whole input to match. find() searches for the next matching part anywhere in the input and can be called repeatedly.`],
[`Why compile a Pattern once?`,`Compiling turns the regex into an internal program, which is the costly step. A static final Pattern is thread-safe and reusable; Matcher objects are not thread-safe.`]],
quiz:[`What does \\d+ match?`,[`One digit`,`One or more digits`,`Any character`,`A decimal point`],1,`\\d is a digit and + means one or more.`]},

{id:`networking`,t:`Networking: sockets, TCP and URLs`,lvl:`I`,min:21,
eli5:`A socket is a phone line between two programs. One program waits for calls on a known number (a port); the other dials it, and then they can talk in both directions until someone hangs up.`,
body:`Java's [[java.net]] package covers low-level networking:
- **TCP** ([[Socket]], [[ServerSocket]]): a reliable, ordered connection. HTTP, databases and most protocols run on it.
- **UDP** ([[DatagramSocket]]): fast, connectionless packets that may be lost or reordered. Used for DNS, streaming and games.
- [[InetAddress]] looks up host names; [[URI]] parses and builds addresses safely.

A server binds to a port and **accepts** connections; each accepted connection is a [[Socket]] with an input and an output stream. With virtual threads, one thread per connection scales to thousands of clients.

For HTTP, use [[HttpClient]] (or Spring's clients) instead of raw sockets. Always set **timeouts**, or a slow or dead peer can block a thread forever.`,
code:`// A tiny echo server: sends back every line it receives
try (var server = new ServerSocket(5000);
     var clients = Executors.newVirtualThreadPerTaskExecutor()) {
    while (true) {
        Socket socket = server.accept();
        clients.submit(() -> {
            try (socket;
                 var in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
                 var out = new PrintWriter(socket.getOutputStream(), true)) {
                socket.setSoTimeout(30_000);                 // don't wait forever
                String line;
                while ((line = in.readLine()) != null) out.println("echo: " + line);
            }
            return null;
        });
    }
}`,
more:[{cap:`The client`,lang:`java`,src:`try (var socket = new Socket()) {
    socket.connect(new InetSocketAddress("localhost", 5000), 3_000);   // connect timeout
    socket.setSoTimeout(5_000);                                         // read timeout
    var out = new PrintWriter(socket.getOutputStream(), true);
    var in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
    out.println("hello");
    System.out.println(in.readLine());      // echo: hello
}`}],
pro:`[[URL]]'s [[equals]] and [[hashCode]] may do DNS lookups, so never use [[URL]] objects as map keys; use [[URI]]. Behind a proxy or load balancer, the socket's remote address is the proxy, not the user; read the forwarded headers your proxy sets. For production servers you'll usually use a framework (Netty, Spring WebFlux, Tomcat) rather than raw sockets, but knowing sockets explains what they do underneath.`,
trap:`Forgetting timeouts. A socket without a read timeout can block a thread forever if the other side stops responding.`,
iq:[[`TCP vs UDP?`,`TCP is connection-based, reliable and ordered, with flow control; UDP sends independent packets with no delivery or ordering guarantees but lower overhead and latency.`],
[`What does ServerSocket.accept() do?`,`It blocks until a client connects, then returns a new Socket for that connection, while the ServerSocket keeps listening for more clients.`]],
quiz:[`Which protocol guarantees that data arrives in order?`,[`UDP`,`TCP`,`Both`,`Neither`],1,`TCP retransmits lost packets and reorders them; UDP doesn't.`]},

{id:`i18n`,t:`Internationalisation: Locale, formatting and resource bundles`,lvl:`I`,min:19,
eli5:`Internationalisation is writing your app so it can speak many languages and follow local habits (1,00,000 in India, 100,000 in the US) without rewriting code: you swap a "locale" instead.`,
body:`A [[Locale]] identifies a language and region, such as [[en-IN]], [[hi-IN]] or [[en-US]]. Java uses it to format and sort things the local way:
- [[NumberFormat]]: numbers, percentages and currencies, including Indian digit grouping for [[en-IN]].
- [[DateTimeFormatter]] with [[ofLocalizedDate]]: dates in the local style and language.
- [[ResourceBundle]]: translated text from [[messages_hi.properties]], [[messages_en.properties]] and so on, with [[MessageFormat]] for placeholders.
- [[Collator]]: sorting that follows a language's alphabet rules.

Keep every user-facing text in resource bundles, store times as [[Instant]] and format them for the user, and store money as numbers with a currency code, formatting only when you display it. Java 18 made UTF-8 the default charset, which removes many encoding bugs.`,
code:`Locale india = Locale.of("en", "IN");          // Java 19+ (new Locale(...) before)
NumberFormat rupees = NumberFormat.getCurrencyInstance(india);
System.out.println(rupees.format(125000.5));    // ₹1,25,000.50

NumberFormat us = NumberFormat.getNumberInstance(Locale.US);
System.out.println(us.format(125000.5));        // 125,000.5

DateTimeFormatter hindi = DateTimeFormatter.ofLocalizedDate(FormatStyle.LONG).withLocale(Locale.of("hi", "IN"));
System.out.println(LocalDate.of(2026, 11, 8).format(hindi));   // the date in Hindi`,
more:[{cap:`Translated messages`,lang:`java`,src:`// src/main/resources/messages_en.properties:  welcome=Welcome, {0}! You have {1} lessons left.
// src/main/resources/messages_hi.properties:  welcome=स्वागत है, {0}! आपके {1} पाठ बाकी हैं।
ResourceBundle bundle = ResourceBundle.getBundle("messages", Locale.of("hi", "IN"));
String text = MessageFormat.format(bundle.getString("welcome"), "Asha", 12);`}],
pro:`Java takes its locale data from the Unicode CLDR project, so formats follow current conventions (which can change between Java versions; don't assert exact formatted strings in tests without fixing the locale). In Spring Boot, [[MessageSource]] and [[LocaleResolver]] load bundles and pick the user's language from the [[Accept-Language]] header. Never build sentences by joining translated fragments: word order differs between languages, so translate whole sentences with placeholders.`,
trap:`Formatting with the server's default locale. A server in the US prints $ and 125,000 for an Indian user; pass the user's Locale explicitly.`,
iq:[[`What is a Locale used for?`,`It tells locale-sensitive APIs which language and regional conventions to use for formatting numbers, currencies and dates, sorting text and choosing translated resources.`],
[`How do resource bundles pick a file?`,`ResourceBundle.getBundle looks for the most specific match (messages_hi_IN, then messages_hi), falls back to the default locale's file, and finally to the base messages file.`]],
quiz:[`Which class formats 125000.5 as ₹1,25,000.50 for India?`,[`String.format`,`NumberFormat.getCurrencyInstance(Locale.of("en", "IN"))`,`DecimalFormat("#,###")`,`Integer.toString`],1,`NumberFormat with an Indian locale applies rupee symbols and lakh grouping.`]}
]},

{id:`modern`,title:`Modern Java`,level:`I`,blurb:`Lambdas, streams, Optional and pattern matching.`,lessons:[
{id:`lambdas`,t:`Lambdas and functional interfaces`,lvl:`I`,min:9,
eli5:`A lambda is a sticky note with instructions that you hand to someone else: "when the button is clicked, do this".`,
body:`A **lambda** is a short anonymous function: [[(params) -> expression]]. It implements a **functional interface**, meaning an interface with exactly one abstract method.

Built-in functional interfaces in [[java.util.function]]:
- [[Predicate<T>]]: takes T, returns boolean (filtering)
- [[Function<T, R>]]: takes T, returns R (transforming)
- [[Consumer<T>]]: takes T, returns nothing (printing, saving)
- [[Supplier<T>]]: takes nothing, returns T (creating)
- plus [[BiFunction]], [[UnaryOperator]] and [[BinaryOperator]]

**Method references** are shorthand when a lambda just calls one method: [[String::length]], [[System.out::println]], [[User::new]].

A lambda can use local variables only if they are **effectively final**.`,
code:`Predicate<String> isLong = s -> s.length() > 5;
Function<String, Integer> len = String::length;
Consumer<String> print = System.out::println;
Supplier<List<String>> fresh = ArrayList::new;

List<String> words = new ArrayList<>(List.of("stream", "map", "lambda", "var"));
words.removeIf(isLong.negate());                  // keep only long words
words.sort(Comparator.comparing(String::length)
                     .thenComparing(Comparator.reverseOrder()));
words.forEach(print);

@FunctionalInterface
interface Discount { double apply(double price); }
Discount festive = p -> p * 0.8;`,
old:`Collections.sort(words, new Comparator<String>() {
    @Override
    public int compare(String a, String b) {
        return Integer.compare(a.length(), b.length());
    }
});`,
neu:`words.sort(Comparator.comparing(String::length));`,oldLabel:`Java 7 anonymous class`,newLabel:`Java 8+ lambda and method reference`,
pro:`Lambdas are not anonymous classes under the hood. The compiler emits an [[invokedynamic]] call that uses [[LambdaMetafactory]] to create the implementation at runtime, and lambdas that capture nothing are reused as singletons. Inside a lambda, [[this]] refers to the enclosing object, not to the lambda.`,
trap:`Changing a local variable inside a lambda (count++) doesn't compile. Use a stream reduction, an AtomicInteger, or restructure the code.`,
iq:[[`What is a functional interface?`,`An interface with exactly one abstract method; default and static methods don't count. @FunctionalInterface is optional but makes the compiler enforce the rule.`],
[`Why must captured variables be effectively final?`,`Lambdas capture values, not variables. Allowing changes would create confusing behaviour and data races when the lambda runs later or on another thread.`]],
quiz:[`Which interface fits x -> x > 10?`,[`Function<Integer, Integer>`,`Predicate<Integer>`,`Supplier<Integer>`,`Consumer<Integer>`],1,`It takes a value and returns a boolean.`]},

{id:`streams`,lab:`stream:lazy`,t:`Stream API`,lvl:`I`,min:16,
eli5:`A stream is a factory conveyor belt. Items pass through stations (filter, map), and at the end something packs the finished products.`,
body:`A **stream** processes a sequence of elements through a pipeline:

1. **Source**: [[list.stream()]], [[Stream.of(...)]], [[IntStream.range(...)]]
2. **Intermediate** operations, which are lazy: [[filter]], [[map]], [[flatMap]], [[sorted]], [[distinct]], [[limit]]
3. A **terminal** operation, which triggers the work: [[collect]], [[toList()]], [[forEach]], [[reduce]], [[count]], [[anyMatch]]

Nothing runs until the terminal operation, and a stream can be consumed **only once**.

Additions over the years: [[takeWhile]] and [[dropWhile]] (Java 9), [[Stream.toList()]] and [[mapMulti]] (Java 16), and **gatherers** for custom intermediate operations (final in Java 24).`,
code:`record Order(String customer, String city, double amount) {}

List<Order> orders = List.of(
    new Order("Asha", "Pune", 1200), new Order("Ravi", "Delhi", 300),
    new Order("Asha", "Pune", 800),  new Order("Kabir", "Delhi", 2500));

List<String> bigSpenders = orders.stream()
    .filter(o -> o.amount() > 1000)
    .map(Order::customer)
    .distinct()
    .toList();                                  // Java 16+: [Asha, Kabir]

Map<String, Double> revenueByCity = orders.stream()
    .collect(Collectors.groupingBy(Order::city,
             Collectors.summingDouble(Order::amount)));   // {Pune=2000.0, Delhi=2800.0}

double avg = orders.stream().mapToDouble(Order::amount).average().orElse(0);`,
pro:`Streams process one element at a time through the whole pipeline, and short-circuiting operations ([[findFirst]], [[limit]], [[anyMatch]]) stop early. [[parallelStream()]] uses the shared common ForkJoinPool; it helps only for large, CPU-bound work on easily split sources such as ArrayList or arrays, and it hurts for I/O or small lists. [[Stream.toList()]] returns an unmodifiable list, whereas [[Collectors.toList()]] currently returns a mutable one.`,
trap:`Calling a terminal operation twice on the same stream throws IllegalStateException ("stream has already been operated upon or closed"). Create a new stream instead.`,
iq:[[`Intermediate vs terminal operations?`,`Intermediate operations return a new stream and are lazy (filter, map). Terminal operations produce a result or side effect and trigger execution (collect, forEach, reduce).`],
[`map vs flatMap?`,`map turns each element into exactly one element. flatMap turns each element into a stream and flattens them all into one stream, for example from List<List<T>> to Stream<T>.`]],
quiz:[`A stream has filter and map but no terminal operation. What happens?`,[`It runs eagerly`,`Nothing runs`,`It throws`,`It runs in parallel`],1,`Intermediate operations are lazy; without a terminal operation, nothing executes.`]},

{id:`collectors`,t:`Collectors: grouping, partitioning and joining`,lvl:`I`,min:16,
eli5:`A collector is the packing station at the end of the conveyor belt: it can box items by city, count them, or string them together into one label.`,
body:`[[collect(…)]] turns a stream into a result using a **Collector**. The most useful ones:
- [[Collectors.toList()]], [[toSet()]], [[toMap(key, value)]]
- [[groupingBy(classifier)]]: a map of lists, such as [[{Pune=[…], Delhi=[…]}]]
- [[groupingBy(classifier, downstream)]]: group, then count, sum, average or map each group
- [[partitioningBy(predicate)]]: exactly two groups, [[true]] and [[false]]
- [[joining(", ")]]: concatenate strings
- [[counting()]], [[summingInt]], [[averagingDouble]], [[summarizingInt]]
- [[teeing(c1, c2, merger)]] (Java 12): two results in one pass

[[toMap]] throws on duplicate keys unless you pass a merge function.`,
code:`record Sale(String city, String product, int qty, double amount) {}
List<Sale> sales = List.of(
    new Sale("Pune", "Java book", 2, 998), new Sale("Delhi", "Java book", 1, 499),
    new Sale("Pune", "Spring course", 1, 2999), new Sale("Delhi", "Mouse", 3, 1200));

Map<String, Double> revenueByCity = sales.stream()
    .collect(Collectors.groupingBy(Sale::city, TreeMap::new, Collectors.summingDouble(Sale::amount)));
// {Delhi=1699.0, Pune=3997.0}

Map<Boolean, List<Sale>> bigAndSmall = sales.stream()
    .collect(Collectors.partitioningBy(s -> s.amount() > 1000));

String products = sales.stream().map(Sale::product).distinct().sorted()
    .collect(Collectors.joining(", ", "[", "]"));        // [Java book, Mouse, Spring course]

Map<String, Integer> qtyByProduct = sales.stream()
    .collect(Collectors.toMap(Sale::product, Sale::qty, Integer::sum));   // merges duplicates

IntSummaryStatistics stats = sales.stream().collect(Collectors.summarizingInt(Sale::qty));
System.out.println(stats.getMax() + " " + stats.getAverage());`,
pro:`[[groupingBy]] returns a [[HashMap]] by default; pass a map supplier such as [[TreeMap::new]] for sorted keys. For parallel streams, [[groupingByConcurrent]] avoids merging per-thread maps. When a collector gets complicated, a plain loop is often clearer and just as fast.`,
trap:`Calling toMap when keys can repeat, without a merge function. It throws IllegalStateException: Duplicate key.`,
iq:[[`groupingBy vs partitioningBy?`,`groupingBy splits by any key into as many groups as there are keys. partitioningBy splits by a condition into exactly two groups, true and false, both always present.`],
[`How do you count items per group?`,`groupingBy(classifier, Collectors.counting()) returns a Map<K, Long>.`]],
quiz:[`Which collector concatenates strings with a separator?`,[`counting()`,`joining(", ")`,`toList()`,`reducing()`],1,`joining concatenates with an optional separator, prefix and suffix.`]},

{id:`optional`,t:`Optional: handling absence`,lvl:`I`,min:9,
eli5:`Optional is a gift box that might be empty. Instead of opening it and getting bitten (a NullPointerException), you check first or say what to use if it's empty.`,
body:`[[Optional<T>]] (Java 8) holds either a value or nothing. It makes "this might be missing" visible in the method signature.

Create one with [[Optional.of(x)]], [[Optional.ofNullable(x)]] or [[Optional.empty()]].

Use it fluently:
- [[map]], [[filter]] and [[flatMap]] to transform the value
- [[orElse(default)]], [[orElseGet(supplier)]] and [[orElseThrow()]] (Java 10)
- [[ifPresent]], [[ifPresentOrElse]] (Java 9) and [[isEmpty()]] (Java 11)

Spring Data's [[findById]] returns an [[Optional]].`,
code:`Optional<User> user = userRepository.findById(id);

String city = user
    .map(User::getAddress)
    .map(Address::getCity)
    .orElse("Unknown");

User u = userRepository.findById(id)
    .orElseThrow(() -> new NotFoundException("User " + id));

user.ifPresentOrElse(
    x -> log.info("Found {}", x.getName()),
    () -> log.warn("No user {}", id));          // Java 9+`,
pro:`Optional was designed as a **return type**. Avoid it for fields (it isn't [[Serializable]]), method parameters and collections (return an empty list instead). [[orElse(expensive())]] always evaluates its argument; use [[orElseGet(() -> expensive())]] when the default is costly to build.`,
trap:`Calling optional.get() without checking. It throws NoSuchElementException, which is just a different crash. Prefer orElseThrow() with a clear message.`,
iq:[[`orElse vs orElseGet?`,`orElse always evaluates its argument, even when a value is present. orElseGet takes a Supplier and only calls it when the Optional is empty.`],
[`Should Optional be used for fields or parameters?`,`Generally no. It's intended for return values. For fields, store null internally and return Optional from the getter; for parameters, use overloading.`]],
quiz:[`Which call throws NoSuchElementException when the Optional is empty?`,[`orElse(x)`,`orElseThrow()`,`ifPresent(...)`,`map(...)`],1,`orElseThrow() with no arguments (Java 10) throws NoSuchElementException.`]},

{id:`patterns`,t:`Pattern matching: instanceof, switch and record patterns`,lvl:`A`,min:22,
eli5:`Pattern matching is a mail sorter that checks an envelope's shape and opens it in one move, instead of checking, then fetching scissors, then opening.`,
body:`Pattern matching tests a value's shape and pulls out its parts in one step.

- **instanceof patterns** (final in Java 16): [[if (obj instanceof String s)]], with no cast needed.
- **switch patterns** (final in Java 21): switch on types, with **guards** ([[when]]) and [[case null]].
- **Record patterns** (final in Java 21): take a record apart right inside the pattern.
- **Unnamed variables** [[_]] (final in Java 22) for the parts you don't need.

Combined with sealed interfaces, the compiler checks that every case is handled.`,
code:`sealed interface Event permits Signup, Purchase, Refund {}
record Signup(String email) implements Event {}
record Purchase(String course, int amountInr) implements Event {}
record Refund(String course, int amountInr, String reason) implements Event {}

String describe(Event e) {
    return switch (e) {
        case Signup(var email)                        -> "Welcome mail to " + email;
        case Purchase(var c, var amt) when amt > 5000 -> "Big sale: " + c;
        case Purchase(var c, _)                       -> "Sale: " + c;     // _ is Java 22+
        case Refund(var c, var amt, _)                -> "Refund " + amt + " for " + c;
    };
}

Object o = 42;
if (o instanceof Integer i && i > 40) {          // Java 16+
    System.out.println(i + 1);
}`,
old:`if (e instanceof Purchase) {
    Purchase p = (Purchase) e;
    if (p.amountInr() > 5000) return "Big sale: " + p.course();
    return "Sale: " + p.course();
} else if (e instanceof Signup) {
    return "Welcome mail to " + ((Signup) e).email();
}
// easy to forget a type: the compiler can't help`,oldLabel:`Before Java 16`,newLabel:`Java 21+ pattern switch`,
pro:`Pattern cases are checked for **dominance**: putting a broad case ([[case Purchase p]]) before a narrower guarded one is a compile error. Primitive type patterns ([[case int i when i > 0]]) have been in preview since Java 23, now in their fifth preview in Java 27. This style is Java's take on algebraic data types, familiar from Scala and Kotlin.`,
trap:`Adding a default branch to a switch over a sealed type. It compiles, but you lose the compile error that would tell you when someone adds a new subtype.`,
iq:[[`What is a guarded pattern?`,`A case pattern followed by when and a boolean condition, such as case Purchase p when p.amountInr() > 5000. The case matches only if both the type and the condition match.`],
[`How do sealed types and pattern matching work together?`,`Because a sealed type lists all its subtypes, the compiler can prove a switch is exhaustive without default, and adding a new subtype forces every such switch to be updated.`]],
quiz:[`Which version made pattern matching for switch final?`,[`Java 16`,`Java 17`,`Java 21`,`Java 25`],2,`It was previewed in Java 17 to 20 and became final in Java 21, together with record patterns.`]},

{id:`modules`,t:`Modules (JPMS)`,lvl:`A`,min:9,
eli5:`Modules are apartment buildings with a front desk: each building decides which rooms visitors may enter, and lists the other buildings it depends on.`,
body:`The **Java Platform Module System** (Java 9) groups packages into modules with explicit boundaries. A [[module-info.java]] file declares:
- [[requires]]: modules this one depends on.
- [[exports]]: packages other modules may use. Everything else is hidden, even [[public]] classes.
- [[opens]]: packages open to deep reflection, which frameworks like Hibernate and Jackson need.
- [[provides … with]] and [[uses]]: service loading.

The JDK itself is modular ([[java.base]], [[java.sql]], [[java.net.http]]…), which lets [[jlink]] build a small custom runtime containing only the modules your app needs.

Most Spring Boot applications still run on the **classpath** without a [[module-info.java]]. Modules shine in libraries and in apps that want strong encapsulation or tiny runtimes. Java 25's [[import module java.base;]] is a separate, simpler feature that imports every package a module exports.`,
code:`// src/main/java/module-info.java
module com.javaatlas.billing {
    requires java.net.http;             // uses the HTTP client
    requires transitive java.sql;       // our public API exposes java.sql types

    exports com.javaatlas.billing.api;                                        // the public API
    opens com.javaatlas.billing.model to com.fasterxml.jackson.databind;      // reflection for JSON
}`,
more:[{cap:`Build a small runtime`,lang:`bash`,src:`# See which modules a JAR needs, then build a runtime with only those
jdeps --print-module-deps target/app.jar
jlink --add-modules java.base,java.net.http,java.sql --output custom-jre --strip-debug --no-header-files
./custom-jre/bin/java -jar target/app.jar`}],
pro:`Strong encapsulation of JDK internals (the default since Java 16, with no opt-out since 17) is why old libraries that used [[sun.misc]] or private JDK fields broke on upgrade; the fix is a newer library version or, temporarily, [[--add-opens]]. Split packages (the same package in two modules) are forbidden and often block migrations. A plain JAR on the module path becomes an automatic module named after the JAR.`,
trap:`Adding module-info.java to a Spring Boot app without opening packages for reflection. The frameworks then fail with InaccessibleObjectException.`,
iq:[[`What does exports do in module-info.java?`,`It makes a package's public types available to other modules. Packages that aren't exported stay hidden, even their public classes.`],
[`exports vs opens?`,`exports allows normal compile-time and runtime access to public types. opens allows deep reflection, including private members, at runtime, which frameworks need.`]],
quiz:[`Which tool builds a smaller custom Java runtime?`,[`javac`,`jshell`,`jlink`,`javadoc`],2,`jlink assembles only the modules your application needs.`]},

{id:`httpclient`,t:`Calling APIs with the Java HTTP Client`,lvl:`I`,min:16,
eli5:`HttpClient is Java's built-in browser without a screen: it sends a request to a web address and hands you back the response.`,
body:`Since Java 11, [[java.net.http.HttpClient]] is the standard way to call HTTP APIs, with no extra library.

1. Build one client and reuse it: [[HttpClient.newBuilder().connectTimeout(…)]].
2. Build a request: address, method, headers, body and timeout.
3. Send it with [[send]] (blocking) or [[sendAsync]] (returns a [[CompletableFuture]]).
4. Choose a body handler: [[ofString()]], [[ofFile(path)]] or [[ofInputStream()]].

It uses HTTP/2 automatically, and HTTP/3 is available since Java 26. Always set timeouts and check the status code: a 404 or 500 is a normal response, not an exception.

In Spring apps, [[RestClient]] and HTTP interface clients add JSON mapping and error handling on top; in plain Java, pair [[HttpClient]] with Jackson for JSON.`,
code:`HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(5))
    .build();                                            // create once, reuse

HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.github.com/repos/openjdk/jdk"))
    .header("Accept", "application/json")
    .timeout(Duration.ofSeconds(10))
    .GET()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
if (response.statusCode() == 200) {
    System.out.println(response.body().substring(0, 80));
} else {
    System.out.println("Failed with status " + response.statusCode());
}

// Several calls in parallel
List<URI> uris = List.of(URI.create("https://example.com/a"), URI.create("https://example.com/b"));
List<CompletableFuture<String>> calls = uris.stream()
    .map(u -> client.sendAsync(HttpRequest.newBuilder(u).build(), HttpResponse.BodyHandlers.ofString())
                    .thenApply(HttpResponse::body))
    .toList();`,
pro:`[[HttpClient]] manages a connection pool, so creating one per request wastes connections and threads. With virtual threads, plain blocking [[send]] calls scale well and read more simply than long [[sendAsync]] chains. To POST JSON, use [[HttpRequest.BodyPublishers.ofString(json)]] with a [[Content-Type: application/json]] header.`,
trap:`Expecting an exception for a 404 or 500. HttpClient only throws for network problems and timeouts; always check statusCode().`,
iq:[[`send vs sendAsync?`,`send blocks the calling thread until the response arrives. sendAsync returns a CompletableFuture immediately, so you can run many requests at the same time.`],
[`Why reuse a single HttpClient?`,`It holds a connection pool and an executor; reusing it keeps connections alive and avoids repeated TCP and TLS handshakes.`]],
quiz:[`When does HttpClient.send throw an exception?`,[`On a 404 response`,`On a 500 response`,`On a network failure or timeout`,`Never`],2,`HTTP error statuses are normal responses; exceptions are for I/O problems.`]}
]}
];
