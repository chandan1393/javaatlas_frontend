import { SubTopic } from '../core/models';

/** Subtopics for the fundamentals stage. Keyed by lesson id. */
export const SUBTOPICS_A: Record<string, SubTopic[]> = {
  jvm: [
    { id: 'jdk-jre-jvm', lab: 'diagram:jdk-jre-jvm', t: 'JDK, JRE and JVM', body: `- The **JVM** (Java Virtual Machine) runs bytecode on your operating system.
- The **JRE** is the JVM plus the standard library. Since Java 11 there's no separate JRE download; you build a small runtime with [[jlink]] if you need one.
- The **JDK** is everything you need to develop: the runtime plus tools such as [[javac]], [[java]], [[jshell]], [[jar]], [[javadoc]], [[jdeps]] and [[jlink]].

Install a JDK (for example Eclipse Temurin or Oracle JDK) and check it with [[java -version]].` },
    { id: 'compile-run', t: 'Compiling and running a program', body: `[[javac]] turns [[.java]] source files into [[.class]] files containing bytecode, and [[java]] runs them. Since Java 11 you can run a single source file directly, and since Java 22 the launcher can run a program made of several source files.`, code: `javac Hello.java        # creates Hello.class
java Hello              # runs it

java Hello.java         # Java 11+: compile in memory and run`, lang: 'bash' },
    { id: 'main', t: 'The main method (and the simple main of Java 25)', body: `A classic program starts at [[public static void main(String[] args)]]. Java 25 finalised compact source files: a file can hold just a [[void main()]] method, with [[IO.println]] for output, which is ideal for learning and small scripts.`, code: `// Classic
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, Java");
    }
}

// Java 25+: a complete program in Hello.java
void main() {
    IO.println("Hello, Java");
}`, min: 25 },
    { id: 'args', t: 'Command-line arguments', body: `Words after the class name arrive in the [[args]] array as strings. Convert them yourself, and check the length before reading them.`, code: `public class Greet {
    public static void main(String[] args) {
        if (args.length < 2) {
            System.out.println("Usage: java Greet <name> <times>");
            return;
        }
        int times = Integer.parseInt(args[1]);
        for (int i = 0; i < times; i++) System.out.println("Hi " + args[0]);
    }
}
// java Greet Asha 3` },
    { id: 'bytecode', t: 'Bytecode and "write once, run anywhere"', body: `Bytecode is the same on Windows, Linux and macOS; each platform's JVM runs it. The JVM interprets it at first and the JIT compiler turns hot code into native machine code. You can see the bytecode of a class with [[javap -c]].` },
    { id: 'jshell', t: 'JShell: try code instantly', body: `[[jshell]] (Java 9) is an interactive shell: type an expression and see the result, with no class or main method. It's perfect for checking how an API behaves.`, code: `$ jshell
jshell> "java".toUpperCase()
$1 ==> "JAVA"
jshell> List.of(3, 1, 2).stream().sorted().toList()
$2 ==> [1, 2, 3]`, lang: 'text' },
    { id: 'jar', t: 'JAR files and the classpath', body: `A **JAR** is a zip of compiled classes and resources. The **classpath** tells the JVM where to find classes. An executable JAR names its main class in the manifest, so it runs with [[java -jar]]. Spring Boot builds such "fat" JARs for you.`, code: `jar --create --file app.jar --main-class com.shop.App -C out .
java -jar app.jar
java -cp "app.jar:libs/*" com.shop.App      # use ; instead of : on Windows`, lang: 'bash' },
  ],
  types: [
    { id: 'primitives', lab: 'diagram:primitive-sizes', t: 'The eight primitive types', body: `- [[byte]] (8-bit, -128 to 127), [[short]] (16-bit), [[int]] (32-bit, about ±2.1 billion), [[long]] (64-bit)
- [[float]] (32-bit) and [[double]] (64-bit) for decimals
- [[char]] (a 16-bit UTF-16 unit, such as 'A')
- [[boolean]] ([[true]] or [[false]])

Use [[int]] for whole numbers, [[long]] for large counts, ids and timestamps, [[double]] for measurements, and [[BigDecimal]] for money.` },
    { id: 'literals', t: 'Literals: writing values in code', body: `Underscores make big numbers readable. Prefixes choose the base, and suffixes choose the type.`, code: `int million = 1_000_000;
int mask = 0b1010_1010;     // binary
int colour = 0xFF8800;      // hexadecimal
long big = 9_000_000_000L;  // L for long
float ratio = 0.75f;        // f for float
char letter = 'A', rupee = '\\u20B9';
int oops = 017;             // octal! this is 15, not 17` },
    { id: 'var', t: 'var: local type inference', body: `Since Java 10, [[var]] lets the compiler infer a local variable's type from its initializer. It's still statically typed. It works only for local variables that are initialised, not for fields, parameters or return types. Use it when the type is obvious from the right-hand side.`, code: `var names = new ArrayList<String>();   // ArrayList<String>
var total = 0L;                         // long
for (var entry : map.entrySet()) { }    // Map.Entry<K, V>
// var x;           // compile error: needs an initializer
// var n = null;    // compile error: type can't be inferred`, min: 10 },
    { id: 'casting', t: 'Type conversion and casting', body: `**Widening** (smaller to larger, such as [[int]] to [[long]] or [[double]]) happens automatically. **Narrowing** needs an explicit cast and can lose information: decimals are truncated and large values wrap around.`, code: `int i = 42;
long l = i;              // widening: automatic
double d = i;            // 42.0

int truncated = (int) 3.99;    // 3
byte wrapped = (byte) 200;     // -56 (200 doesn't fit in a byte)
char c = (char) 66;            // 'B'
int code = 'A';                // 65` },
    { id: 'wrappers', t: 'Wrapper classes and autoboxing', body: `Each primitive has a wrapper class: [[Integer]], [[Long]], [[Double]], [[Character]], [[Boolean]] and so on. Collections need objects, so Java converts automatically (**autoboxing** and **unboxing**). Two traps: unboxing [[null]] throws [[NullPointerException]], and [[==]] on wrappers compares references.`, code: `List<Integer> scores = new ArrayList<>();
scores.add(90);                  // autoboxing int -> Integer
int first = scores.get(0);       // unboxing

Integer a = 127, b = 127, x = 128, y = 128;
System.out.println(a == b);      // true  (cached values -128..127)
System.out.println(x == y);      // false (different objects)
System.out.println(x.equals(y)); // true: always use equals

Integer missing = null;
int boom = missing;              // NullPointerException` },
    { id: 'defaults', t: 'Default values, scope and constants', body: `Fields get default values ([[0]], [[false]], [[null]]); local variables don't and must be assigned before use. A variable lives only inside the block ([[{ }]]) where it's declared. Mark values that never change as [[final]]; constants are [[static final]] and written in UPPER_SNAKE_CASE.` },
    { id: 'overflow', t: 'Integer overflow', body: `Integer arithmetic silently wraps around when it goes past the maximum. Use [[long]], the [[Math.*Exact]] methods that throw on overflow, or [[BigInteger]] for arbitrarily large numbers.`, code: `int max = Integer.MAX_VALUE;         // 2147483647
System.out.println(max + 1);          // -2147483648
long ok = (long) max + 1;             // 2147483648
Math.addExact(max, 1);                // throws ArithmeticException
BigInteger huge = BigInteger.TWO.pow(100);` },
  ],
  flow: [
    { id: 'if-else', t: 'if, else if and else', body: `Conditions must be [[boolean]] expressions. Always use braces, even for one line; it prevents bugs when someone adds a second line later.`, code: `if (marks >= 90) {
    grade = "A";
} else if (marks >= 75) {
    grade = "B";
} else {
    grade = "C";
}` },
    { id: 'switch-statement', t: 'The classic switch statement', body: `Classic [[switch]] works on integers, [[char]], [[String]] (Java 7) and enums. Without [[break]], execution **falls through** into the next case, which is a common bug.`, code: `switch (day) {
    case "SAT":
    case "SUN":
        System.out.println("Weekend");
        break;
    default:
        System.out.println("Weekday");
}` },
    { id: 'switch-expression', t: 'Switch expressions (Java 14)', body: `Arrow labels don't fall through, a switch can return a value, and the compiler checks that enum switches cover every case. Use [[yield]] to return a value from a block.`, code: `int days = switch (month) {
    case FEB -> leapYear ? 29 : 28;
    case APR, JUN, SEP, NOV -> 30;
    default -> 31;
};

String label = switch (status) {
    case PAID -> "Paid";
    case FAILED -> {
        log.warn("Payment failed");
        yield "Failed";
    }
    default -> "Pending";
};`, min: 14 },
    { id: 'loops', t: 'for, while and do-while', body: `- [[for]]: when you know how many times to repeat.
- [[while]]: repeat while a condition holds; it may run zero times.
- [[do … while]]: runs at least once, and checks the condition afterwards (handy for input prompts).`, code: `for (int i = 1; i <= 5; i++) System.out.print(i + " ");

int n = 100;
while (n > 1) n /= 2;

int choice;
do {
    choice = askUser();
} while (choice < 1 || choice > 3);` },
    { id: 'for-each', t: 'The enhanced for loop (for-each)', body: `For-each reads every element of an array or collection without an index. You can't change the collection's size inside it: removing items throws [[ConcurrentModificationException]]; use [[removeIf]] or an iterator instead.`, code: `for (String name : names) {
    System.out.println(name);
}
names.removeIf(n -> n.isBlank());   // safe removal` },
    { id: 'break-continue', t: 'break, continue and labels', body: `[[break]] leaves the loop, and [[continue]] skips to the next iteration. A **label** lets [[break]] leave an outer loop from inside a nested one.`, code: `outer:
for (int[] row : grid) {
    for (int cell : row) {
        if (cell < 0) continue;          // skip negatives
        if (cell == target) break outer; // stop both loops
    }
}` },
    { id: 'pattern-switch', t: 'Pattern matching in switch (Java 21)', body: `Modern switches can test types and destructure records, with guards written using [[when]]. The patterns lesson covers this in depth.`, code: `String describe(Object o) {
    return switch (o) {
        case Integer i when i > 100 -> "big number";
        case Integer i -> "number " + i;
        case String s -> "text of length " + s.length();
        case null -> "nothing";
        default -> "something else";
    };
}`, min: 21 },
  ],
  arrays: [
    { id: 'declare', t: 'Creating arrays', body: `An array has a fixed length set when it's created. Elements get default values (0, [[false]] or [[null]]). Indexes run from 0 to [[length - 1]]; going outside throws [[ArrayIndexOutOfBoundsException]].`, code: `int[] marks = new int[5];            // [0, 0, 0, 0, 0]
String[] cities = {"Pune", "Delhi"};
marks[0] = 91;
System.out.println(marks.length);    // 5 (a field, not a method)
System.out.println(marks[5]);        // ArrayIndexOutOfBoundsException` },
    { id: 'iterate', t: 'Looping over arrays', body: `Use for-each when you only read values, and an index loop when you need the position or want to change elements.`, code: `int sum = 0;
for (int m : marks) sum += m;

for (int i = 0; i < marks.length; i++) {
    marks[i] = marks[i] + 5;    // bonus marks
}` },
    { id: 'multi', t: 'Two-dimensional and jagged arrays', body: `A 2D array is an array of arrays. Rows can have different lengths (a **jagged** array).`, code: `int[][] grid = new int[3][4];          // 3 rows, 4 columns
grid[1][2] = 7;

int[][] triangle = new int[3][];
for (int r = 0; r < 3; r++) triangle[r] = new int[r + 1];

System.out.println(Arrays.deepToString(grid));` },
    { id: 'arrays-class', t: 'The Arrays utility class', body: `[[java.util.Arrays]] has the everyday helpers: [[toString]], [[sort]], [[binarySearch]] (on sorted arrays), [[fill]], [[copyOf]], [[copyOfRange]], [[equals]] and [[stream]]. [[Arrays.asList]] returns a **fixed-size** list backed by the array: [[add]] throws [[UnsupportedOperationException]].`, code: `int[] a = {5, 2, 9, 1};
Arrays.sort(a);                               // [1, 2, 5, 9]
int pos = Arrays.binarySearch(a, 5);          // 2
int[] bigger = Arrays.copyOf(a, 6);           // [1, 2, 5, 9, 0, 0]
Arrays.fill(bigger, -1);
System.out.println(Arrays.toString(a));
int total = Arrays.stream(a).sum();

List<String> fixed = Arrays.asList("a", "b");
// fixed.add("c");  // UnsupportedOperationException` },
    { id: 'array-vs-list', t: 'Arrays vs ArrayList', body: `- **Array**: fixed size, can hold primitives, slightly faster, simple syntax.
- **ArrayList**: grows as needed, has rich methods ([[add]], [[remove]], [[contains]]), works with streams and generics, but holds objects only (so [[int]] values are boxed).

In business code, use [[List]]; use arrays for fixed-size data, performance-critical loops or APIs that require them.` },
    { id: 'algorithms', t: 'Common array tasks', body: `Finding the maximum, reversing in place and checking for a value are classic warm-up problems in interviews.`, code: `int max = a[0];
for (int x : a) if (x > max) max = x;

for (int i = 0, j = a.length - 1; i < j; i++, j--) {   // reverse in place
    int tmp = a[i]; a[i] = a[j]; a[j] = tmp;
}

boolean hasNine = Arrays.stream(a).anyMatch(x -> x == 9);` },
  ],
  methods: [
    { id: 'anatomy', t: 'Anatomy of a method', body: `A method has modifiers, a return type ([[void]] for none), a name, parameters and a body. [[return]] ends the method and hands back a value.`, code: `public static double withGst(double price, double rate) {
    if (price < 0) throw new IllegalArgumentException("price can't be negative");
    return price * (1 + rate);
}` },
    { id: 'pass-by-value', t: 'Java is always pass-by-value', body: `Java copies every argument. For primitives it copies the value. For objects it copies the **reference**, so the method can change the object the reference points to, but reassigning the parameter doesn't affect the caller's variable.`, code: `static void change(int n, List<String> list) {
    n = 99;                 // caller's int is unchanged
    list.add("added");      // caller sees this: same object
    list = new ArrayList<>(); // caller's variable is unchanged
}` },
    { id: 'overloading', t: 'Method overloading', body: `Several methods can share a name if their parameter lists differ (number, types or order). The return type alone isn't enough. The compiler picks the best match, preferring an exact match, then widening, then boxing, then varargs.`, code: `static int area(int side) { return side * side; }
static int area(int w, int h) { return w * h; }
static double area(double radius) { return Math.PI * radius * radius; }

area(4);        // int version
area(4, 5);     // two-int version
area(2.5);      // double version` },
    { id: 'varargs', t: 'Varargs', body: `[[type... name]] accepts any number of arguments, received as an array. Only the last parameter can be varargs.`, code: `static int sum(int... numbers) {
    int total = 0;
    for (int n : numbers) total += n;
    return total;
}
sum();            // 0
sum(1, 2, 3);     // 6
sum(new int[]{4, 5});` },
    { id: 'static-instance', t: 'Static vs instance methods', body: `A **static** method belongs to the class and is called on it ([[Math.max(a, b)]]); it can't use [[this]]. An **instance** method works on one object's data and is called on that object ([[name.length()]]). Utility functions are static; behaviour tied to an object's state is instance.` },
    { id: 'multiple-returns', t: 'Returning several values', body: `A method returns one value, but that value can be a record holding several. It's clearer than arrays or out-parameters.`, code: `record MinMax(int min, int max) {}

static MinMax range(int[] values) {
    int min = Integer.MAX_VALUE, max = Integer.MIN_VALUE;
    for (int v : values) { min = Math.min(min, v); max = Math.max(max, v); }
    return new MinMax(min, max);
}

var r = range(new int[]{4, 9, 1});
System.out.println(r.min() + " to " + r.max());`, min: 16 },
  ],
  strings: [
    { id: 'create-pool', t: 'Creating strings and the string pool', body: `String literals are stored once in the **string pool** and shared. [[new String("x")]] always creates a new object, which you almost never need. [[intern()]] returns the pooled copy.`, code: `String a = "java";
String b = "java";               // same pooled object as a
String c = new String("java");   // a new object on the heap

System.out.println(a == b);           // true  (same object)
System.out.println(a == c);           // false (different objects)
System.out.println(a == c.intern());  // true` },
    { id: 'immutability', t: 'Why strings are immutable', body: `A [[String]] never changes after it's created; methods such as [[toUpperCase]] return a **new** string. That makes strings safe to share between threads, safe as [[HashMap]] keys (the hash is cached), and safe to use for things like file paths and class names.`, code: `String s = "hello";
s.toUpperCase();         // result thrown away: s is still "hello"
s = s.toUpperCase();     // "HELLO": keep the new string` },
    { id: 'compare', t: 'Comparing strings', body: `- [[equals]] compares content; [[==]] compares references (a classic bug).
- [[equalsIgnoreCase]] ignores case.
- [[compareTo]] orders strings alphabetically (negative, zero or positive).
- [[Objects.equals(a, b)]] is null-safe. So is [["literal".equals(input)]].`, code: `String input = readName();
if ("admin".equals(input)) { }          // no NPE if input is null
"apple".compareTo("banana");            // negative: apple comes first
"Java".equalsIgnoreCase("JAVA");        // true` },
    { id: 'methods', t: 'Everyday String methods', body: `The methods you'll use constantly. [[substring(begin, end)]] excludes [[end]]. [[strip]] (Java 11) understands Unicode spaces; [[trim]] only removes ASCII ones.`, code: `String s = "  Hello, Java World  ";
s.length();                    // 20
s.strip();                     // "Hello, Java World"
s.strip().charAt(0);           // 'H'
s.strip().substring(7, 11);    // "Java"
s.indexOf("Java");             // 9
s.contains("World");           // true
s.strip().startsWith("Hello"); // true
s.replace("Java", "Spring");   // "  Hello, Spring World  "
s.isBlank();                   // false  (Java 11)
"ab".repeat(3);                // "ababab" (Java 11)
"a\\nb\\nc".lines().count();     // 3 (Java 11)`, min: 11 },
    { id: 'split-join', t: 'Splitting and joining', body: `[[split]] takes a **regular expression**, so special characters such as [[.]] and [[|]] must be escaped. [[String.join]] and [[Collectors.joining]] do the reverse.`, code: `"a,b,,c".split(",");            // [a, b, , c]
"1.2.3".split("\\\\.");           // [1, 2, 3] (escape the dot)
"k=v=w".split("=", 2);          // [k, v=w] (limit)

String csv = String.join(", ", List.of("Pune", "Delhi", "Goa"));
String ids = orders.stream().map(Order::id).collect(Collectors.joining("|"));` },
    { id: 'builder', t: 'StringBuilder and StringBuffer', body: `Building a string piece by piece? Use [[StringBuilder]]: it's mutable, so it doesn't create a new object each time. [[StringBuffer]] is the older, synchronized version; you rarely need it.`, code: `StringBuilder sb = new StringBuilder();
for (int i = 1; i <= 5; i++) {
    sb.append(i).append(i < 5 ? "," : "");
}
sb.insert(0, "[").append("]");        // "[1,2,3,4,5]"
sb.reverse();                          // "]5,4,3,2,1["
String result = sb.toString();` },
    { id: 'concat', t: 'Concatenation and performance', body: `Joining with [[+]] in one expression is fine: since Java 9 the compiler uses an optimised strategy. Inside a **loop**, though, each [[+=]] creates a new string, so building a large string that way is slow (O(n²)). Use [[StringBuilder]] or [[Collectors.joining]] in loops.` },
    { id: 'format', t: 'Formatting and text blocks', body: `[[String.format]] and [[formatted]] (Java 15) build text from a pattern. **Text blocks** (Java 15) hold multi-line text such as JSON, SQL or HTML without escaping quotes; a trailing [[\\]] joins lines.`, code: `String line = "%-10s %8.2f".formatted("Total", 1499.5);   // "Total       1499.50"

String json = """
    {
      "name": "Asha",
      "city": "Pune"
    }
    """;

String sql = """
    SELECT id, name FROM course \\
    WHERE published = true""";`, min: 15 },
    { id: 'unicode', t: 'char, Unicode and emoji', body: `A [[char]] is one UTF-16 unit, so characters outside the basic range (many emoji, some scripts) take **two** chars. Use [[codePoints()]] to count or iterate real characters, and the [[Character]] class to test them.`, code: `String s = "Hi 👋";
s.length();                       // 5 (the emoji is 2 chars)
s.codePointCount(0, s.length());  // 4 real characters
Character.isLetter('क');          // true
Character.isDigit('7');           // true
Character.toUpperCase('a');       // 'A'` },
    { id: 'convert', t: 'Converting to and from strings', body: `[[String.valueOf]] turns anything into a string. [[Integer.parseInt]] and friends go the other way and throw [[NumberFormatException]] on bad input, so validate or catch it.`, code: `String s1 = String.valueOf(42);
String s2 = Integer.toString(255, 16);     // "ff"
int n = Integer.parseInt("123");
double d = Double.parseDouble("3.14");
char[] chars = "java".toCharArray();
String back = new String(chars);
byte[] utf8 = "₹100".getBytes(StandardCharsets.UTF_8);

try {
    Integer.parseInt("12a");
} catch (NumberFormatException e) {
    System.out.println("Not a number");
}` },
  ],
};
