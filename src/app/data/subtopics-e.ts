import { SubTopic } from '../core/models';

/** Extra subtopics APPENDED to a lesson's existing ones (see ContentService). */
export const SUBTOPICS_EXTRA: Record<string, SubTopic[]> = {
  operators: [
    { id: 'bitwise', t: 'Bitwise and shift operators', body: `They work on the individual bits of integers:
- [[&]] AND, [[|]] OR, [[^]] XOR (exclusive or), [[~]] NOT (flips every bit).
- [[<<]] shifts left (multiplies by 2 per step), [[>>]] shifts right keeping the sign, [[>>>]] shifts right filling with zeros.

You'll meet them in flags and permissions, hashing (HashMap computes the bucket with [[hash & (n - 1)]]) and fast checks such as "is this number odd?".`, code: `int read = 1, write = 2, exec = 4;          // one bit per permission
int perms = read | write;                    // 3 (binary 011)
boolean canWrite = (perms & write) != 0;     // true
perms = perms & ~write;                      // remove write: 1

System.out.println(7 & 1);       // 1: odd
System.out.println(5 << 1);      // 10: times 2
System.out.println(-16 >> 2);    // -4: sign kept
System.out.println(-16 >>> 28);  // 15: zeros shifted in` },
    { id: 'compound', t: 'Compound assignment hides a cast', body: `[[x += y]] isn't exactly [[x = x + y]]: compound assignment casts the result back to the type of [[x]]. That makes some lines compile that look like they shouldn't, and can silently overflow.`, code: `byte b = 10;
b += 5;            // compiles: means b = (byte) (b + 5)
// b = b + 5;      // compile error: b + 5 is an int

byte big = 120;
big += 10;         // silently wraps to -126

char c = 'A';
c += 1;            // 'B'` },
  ],
  'static-final': [
    { id: 'final-finally-finalize', t: 'final vs finally vs finalize', body: `Three similar words, three unrelated features (a classic interview question):
- **final** is a keyword: a final variable can't be reassigned, a final method can't be overridden, a final class can't be extended.
- **finally** is a block after try/catch that always runs, used for clean-up (today usually replaced by try-with-resources).
- **finalize()** was a method the garbage collector might call before reclaiming an object. It's unpredictable, slow and **deprecated for removal** since Java 18; use try-with-resources or java.lang.ref.Cleaner instead.` },
  ],
  enums: [
    { id: 'enumset-enummap', t: 'EnumSet and EnumMap', body: `When the elements or keys are enum constants, use these specialised collections. Internally they're a bit set and an array indexed by the constant's ordinal, so they're extremely fast and compact, and they iterate in declaration order.`, code: `enum Day { MON, TUE, WED, THU, FRI, SAT, SUN }

EnumSet<Day> weekend = EnumSet.of(Day.SAT, Day.SUN);
EnumSet<Day> workdays = EnumSet.complementOf(weekend);      // MON..FRI
EnumSet<Day> midweek = EnumSet.range(Day.TUE, Day.THU);

EnumMap<Day, Integer> classes = new EnumMap<>(Day.class);
classes.put(Day.MON, 2);
classes.put(Day.WED, 1);
System.out.println(classes);   // {MON=2, WED=1}  always in declaration order` },
  ],
  collections: [
    { id: 'custom-iterable', t: 'Making your own class iterable', body: `Implement [[Iterable<T>]] (one method, [[iterator()]]) and your class works in for-each loops. The iterator keeps track of where it is with [[hasNext()]] and [[next()]].`, code: `record Range(int from, int to) implements Iterable<Integer> {
    @Override public Iterator<Integer> iterator() {
        return new Iterator<>() {
            private int next = from;
            @Override public boolean hasNext() { return next < to; }
            @Override public Integer next() {
                if (!hasNext()) throw new NoSuchElementException();
                return next++;
            }
        };
    }
}

for (int i : new Range(1, 4)) System.out.print(i + " ");   // 1 2 3` },
  ],
  maps: [
    { id: 'special-maps', t: 'Special maps: EnumMap, WeakHashMap and IdentityHashMap', body: `- **EnumMap**: enum keys, backed by an array. The fastest map when keys are enum constants.
- **WeakHashMap**: holds its keys weakly, so an entry disappears once nothing else references the key. Useful for caches attached to objects you don't own. (String literals and small Integers are never collected, so don't use them as keys.)
- **IdentityHashMap**: compares keys with [[==]] instead of [[equals()]]. Used for graph algorithms and serialization frameworks that track object identity.` },
  ],
  jvm: [
    { id: 'compact-source', t: 'Java 25: compact source files and instance main methods', body: `Since Java 25, a beginner's first program needs no class and no [[public static void main(String[] args)]]. A file with just a [[main]] method is a complete program, the [[IO]] class handles console input and output, and the [[java]] launcher runs the source file directly. As programs grow, they turn into normal classes.`, code: `// Hello.java   run with:  java Hello.java
void main() {
    String name = IO.readln("What's your name? ");
    IO.println("Hello, " + name + "!");
}`, min: 25 },
  ],
  vthreads: [
    { id: 'structured', t: 'Structured concurrency (preview in Java 25)', body: `**Structured concurrency** treats a group of related tasks as one unit: they start inside a scope, and the scope doesn't end until all of them finish. If one fails, the others are cancelled automatically, so no thread is left running in the background. It pairs naturally with virtual threads. In Java 25 it's a **preview** API (compile and run with [[--enable-preview]]), so it may still change.`, code: `Profile load(long userId) throws InterruptedException {
    try (var scope = StructuredTaskScope.open()) {                 // Java 25 preview API
        Subtask<User> user = scope.fork(() -> findUser(userId));        // each on its own virtual thread
        Subtask<List<Order>> orders = scope.fork(() -> findOrders(userId));
        scope.join();                     // waits for both; if one fails, the other is cancelled
        return new Profile(user.get(), orders.get());
    }
}`, min: 25 },
  ],
  maven: [
    { id: 'gradle', t: 'Gradle at a glance', body: `**Gradle** is the other major build tool. It uses the same Maven Central repositories and the same group:artifact:version coordinates, but describes builds in code (Kotlin or Groovy) instead of XML. It's the standard for Android, and Spring Initializr offers both. Always run it through the wrapper ([[./gradlew]]) so everyone uses the same version.`, code: `// build.gradle.kts
plugins {
    java
    id("org.springframework.boot") version "4.1.0"
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

// ./gradlew build     ./gradlew test     ./gradlew bootRun`, lang: 'text' },
  ],
};
