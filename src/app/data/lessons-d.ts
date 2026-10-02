import { Stage } from '../core/models';

/** Stages for data structures and algorithms, design and clean code, and tools and testing. */
export const STAGES_D: Stage[] = [
{id:`dsa`,title:`Data structures and algorithms`,level:`I`,blurb:`Big-O, sorting and searching, linked lists, stacks and queues, trees and graphs, and dynamic programming.`,lessons:[
{id:`bigo`,diagram:`big-o-growth`,t:`Big-O: how fast is your code?`,lvl:`B`,
eli5:`Big-O answers "what happens when the input gets 1,000 times bigger?" Looking for a name page by page grows with the phone book; opening it in the middle each time barely grows at all.`,
body:`**Big-O** describes how running time (or memory) grows with the input size **n**, ignoring constants.

- **O(1)**, constant: an array index, [[HashMap.get]].
- **O(log n)**: halves the problem each step, like binary search or a [[TreeMap]] lookup.
- **O(n)**: one pass, like finding the maximum or [[list.contains]].
- **O(n log n)**: efficient sorting such as [[List.sort]].
- **O(n²)**: nested loops over the same data, like comparing every pair.
- **O(2ⁿ)**: trying every subset, like naive recursive Fibonacci.

To estimate it, look at how loops nest, drop constants ([[O(2n)]] is [[O(n)]]) and keep the biggest term ([[O(n² + n)]] is [[O(n²)]]).

For a million items, O(n log n) is about 20 million steps (fast) while O(n²) is a trillion (hours). Picking the right data structure is often the whole optimisation.`,
code:`// O(n²): compare every pair
static boolean hasDuplicateSlow(int[] a) {
    for (int i = 0; i < a.length; i++)
        for (int j = i + 1; j < a.length; j++)
            if (a[i] == a[j]) return true;
    return false;
}

// O(n): one pass with a HashSet (O(1) average add and contains)
static boolean hasDuplicateFast(int[] a) {
    Set<Integer> seen = new HashSet<>();
    for (int x : a) {
        if (!seen.add(x)) return true;        // add returns false if already present
    }
    return false;
}

// O(log n): binary search on sorted data
int[] sorted = {3, 8, 15, 23, 42, 57};
int index = Arrays.binarySearch(sorted, 23);   // 3`,
pro:`Big-O hides constants and memory effects: for small inputs an O(n) scan over an array often beats O(log n) lookups in a pointer-heavy tree, because CPUs love contiguous memory. **Amortised** cost matters too: [[ArrayList.add]] is O(1) amortised even though an occasional resize copies everything. In interviews, always state time and space complexity and the trade-off (the fast duplicate check uses O(n) extra memory).`,
trap:`Calling list.contains or list.remove(Object) inside a loop. Each call is O(n), so the loop becomes O(n²); use a HashSet.`,
iq:[[`What is the time complexity of HashMap.get?`,`O(1) on average, and O(log n) in the worst case since Java 8, when a crowded bucket has been turned into a tree.`],
[`What does amortised O(1) mean?`,`Most operations take constant time but a few are expensive (such as resizing); averaged over many operations, the cost per operation is constant.`]],
quiz:[`Two nested loops over the same array of n items are typically…`,[`O(n)`,`O(log n)`,`O(n²)`,`O(1)`],2,`n iterations inside n iterations gives n × n steps.`]},

{id:`sorting`,lab:`array:binary-search`,t:`Sorting and searching`,lvl:`I`,
eli5:`Sorting is putting books on a shelf in order; searching is finding one. Once the shelf is sorted, you can find any book by checking the middle of the remaining section each time.`,
body:`In real code, use the library: [[Arrays.sort]], [[List.sort]] or [[Collections.sort]]. Java uses **dual-pivot quicksort** for primitives and **TimSort** (stable, O(n log n)) for objects.

Interviews, and your own understanding, still need the classics:
- **Bubble and insertion sort**: O(n²). Insertion sort is fast on small, nearly sorted arrays.
- **Merge sort**: split in halves, sort each, merge. Always O(n log n) and stable, but needs O(n) extra space.
- **Quick sort**: pick a pivot, partition, recurse. O(n log n) on average, O(n²) in the worst case, sorts in place.

**Binary search** finds an item in a **sorted** array in O(log n): compare with the middle, discard half, repeat. It also answers questions like "the first position where the value is at least x", which appear in many interview problems.`,
code:`static void mergeSort(int[] a, int lo, int hi) {            // sorts a[lo..hi)
    if (hi - lo < 2) return;
    int mid = (lo + hi) >>> 1;
    mergeSort(a, lo, mid);
    mergeSort(a, mid, hi);
    int[] merged = new int[hi - lo];
    int i = lo, j = mid, k = 0;
    while (i < mid && j < hi) merged[k++] = a[i] <= a[j] ? a[i++] : a[j++];
    while (i < mid) merged[k++] = a[i++];
    while (j < hi) merged[k++] = a[j++];
    System.arraycopy(merged, 0, a, lo, merged.length);
}

static int firstAtLeast(int[] sorted, int target) {         // binary search: lower bound
    int lo = 0, hi = sorted.length;
    while (lo < hi) {
        int mid = (lo + hi) >>> 1;                           // avoids int overflow
        if (sorted[mid] < target) lo = mid + 1; else hi = mid;
    }
    return lo;                                               // equals length if none
}

int[] marks = {72, 38, 91, 55, 64};
mergeSort(marks, 0, marks.length);                           // [38, 55, 64, 72, 91]
System.out.println(firstAtLeast(marks, 60));                 // 2`,
pro:`[[(lo + hi) / 2]] overflows when both numbers are large; [[(lo + hi) >>> 1]] or [[lo + (hi - lo) / 2]] doesn't. This exact bug sat in the JDK's own binary search for years. Stability matters when you sort by several keys in passes. For top-k problems you don't need a full sort: a [[PriorityQueue]] of size k is O(n log k).`,
trap:`Running binary search on unsorted data. It silently returns wrong answers; sort first or use a different structure.`,
iq:[[`Merge sort vs quick sort?`,`Merge sort is always O(n log n) and stable but needs O(n) extra memory. Quick sort is O(n log n) on average, O(n²) in the worst case, sorts in place and is usually faster in practice thanks to cache-friendly access.`],
[`Which algorithm does Java use to sort objects?`,`TimSort, a stable hybrid of merge sort and insertion sort that is very fast on partly sorted data.`]],
quiz:[`Binary search requires the data to be…`,[`Unique`,`Sorted`,`In a linked list`,`Numbers only`],1,`It relies on order to discard half of the range at each step.`]},

{id:`linkedlists`,lab:`linkedlist`,t:`Linked lists, stacks and queues`,lvl:`I`,
eli5:`A linked list is a treasure hunt: each clue tells you where the next one is. Adding a clue in the middle is easy, but to reach the tenth clue you must follow the first nine.`,
body:`A **linked list** stores nodes that point to the next node. Inserting or removing at a known node is O(1), but reaching position i is O(n).

A **stack** is last in, first out: undo, the browser's back button, matching brackets. A **queue** is first in, first out: print jobs, breadth-first search, task queues. In Java, [[ArrayDeque]] implements both.

Classic interview problems:
- Reverse a linked list with three pointers.
- Detect a cycle with fast and slow pointers (Floyd's algorithm).
- Find the middle node: the fast pointer moves two steps for every one.
- Check balanced brackets with a stack.

Build these yourself once to understand them; in production, use the JDK's collections.`,
code:`class Node {
    int value;
    Node next;
    Node(int value, Node next) { this.value = value; this.next = next; }
}

static Node reverse(Node head) {
    Node prev = null, current = head;
    while (current != null) {
        Node next = current.next;      // save the rest of the list first
        current.next = prev;
        prev = current;
        current = next;
    }
    return prev;
}

static boolean hasCycle(Node head) {              // Floyd: tortoise and hare
    Node slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}

static boolean balanced(String s) {               // a stack of open brackets
    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if ("([{".indexOf(c) >= 0) stack.push(c);
        else if (")]}".indexOf(c) >= 0) {
            if (stack.isEmpty() || "([{".indexOf(stack.pop()) != ")]}".indexOf(c)) return false;
        }
    }
    return stack.isEmpty();
}
System.out.println(balanced("{[()()]}"));          // true`,
pro:`Java's [[LinkedList]] is doubly linked and implements both [[List]] and [[Deque]], but every node is a separate object scattered in memory, so iterating it is much slower than [[ArrayList]] or [[ArrayDeque]] in practice. Linked structures still matter conceptually: [[HashMap]] buckets, [[LinkedHashMap]]'s ordering and many concurrent queues use linked nodes.`,
trap:`Losing the rest of the list while reversing it by overwriting current.next before saving it. Always keep a reference to the next node first.`,
iq:[[`How do you detect a cycle in a linked list?`,`Move one pointer one step and another two steps at a time. If they ever meet there's a cycle; if the fast one reaches null there isn't. O(n) time and O(1) space.`],
[`When would you choose a linked list over an array list?`,`Rarely in Java: only when you insert and remove often in the middle through an iterator and never need access by position. Otherwise ArrayList or ArrayDeque is faster.`]],
quiz:[`Which data structure checks balanced brackets?`,[`Queue`,`Stack`,`HashSet`,`TreeMap`],1,`Push each opening bracket and pop to match each closing one.`]},

{id:`trees`,lab:`tree:map`,t:`Trees and graphs`,lvl:`I`,min:9,
eli5:`A tree is a family tree: one ancestor at the top and children below. A graph is a road map: any city can connect to any other, and roads can form loops.`,
body:`**Trees** have a root and child nodes, with no cycles. A **binary search tree** (BST) keeps smaller values on the left and larger on the right, so searching is O(log n) when the tree is balanced. [[TreeMap]] and [[TreeSet]] are self-balancing red-black trees.

Ways to walk a tree:
- **In-order** (left, node, right): gives a BST's values in sorted order.
- **Pre-order** and **post-order**: used for copying and deleting trees.
- **Level order** (breadth-first), using a queue.

**Graphs** are nodes connected by edges: social networks, maps, build dependencies. Store them as an **adjacency list**, [[Map<String, List<String>>]].
- **BFS** (a queue) finds the shortest path when every edge counts the same.
- **DFS** (a stack or recursion) explores deeply: cycle detection, ordering build steps.
- **Dijkstra** (a priority queue) finds shortest paths when edges have weights.`,
code:`class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

static TreeNode insert(TreeNode root, int v) {
    if (root == null) return new TreeNode(v);
    if (v < root.val) root.left = insert(root.left, v);
    else root.right = insert(root.right, v);
    return root;
}

static void inOrder(TreeNode n, List<Integer> out) {
    if (n == null) return;
    inOrder(n.left, out);
    out.add(n.val);
    inOrder(n.right, out);
}

// BFS: fewest introductions between two people
static int degrees(Map<String, List<String>> friends, String from, String to) {
    Queue<String> queue = new ArrayDeque<>(List.of(from));
    Map<String, Integer> dist = new HashMap<>(Map.of(from, 0));
    while (!queue.isEmpty()) {
        String p = queue.poll();
        if (p.equals(to)) return dist.get(p);
        for (String f : friends.getOrDefault(p, List.of())) {
            if (dist.putIfAbsent(f, dist.get(p) + 1) == null) queue.add(f);   // visit once
        }
    }
    return -1;
}`,
pro:`An unbalanced BST turns into a linked list (O(n)) if you insert sorted data; balanced trees (red-black, AVL, B-trees) prevent this. Databases index with **B+ trees**, which keep many keys per node to minimise disk reads; that's what a PostgreSQL index is. Recursion depth equals tree height, so very deep trees need an explicit stack.`,
trap:`Forgetting to track visited nodes in a graph walk. With a cycle, BFS or DFS loops forever.`,
iq:[[`BFS vs DFS?`,`BFS explores level by level with a queue and finds the shortest path in unweighted graphs. DFS goes deep first with a stack or recursion, and is used for cycle detection, topological sorting and connected components.`],
[`What does an in-order walk of a BST produce?`,`The values in ascending sorted order.`]],
quiz:[`Which structure does breadth-first search use?`,[`Stack`,`Queue`,`TreeSet`,`Array only`],1,`A first-in, first-out queue processes nodes level by level.`]},

{id:`dp`,t:`Dynamic programming`,lvl:`A`,
eli5:`Dynamic programming is doing your homework once and keeping the notes. When the same question comes up again, you look up the answer instead of solving it again.`,
body:`**Dynamic programming** (DP) solves problems made of **overlapping subproblems** with **optimal substructure**: the best answer is built from the best answers to smaller versions of the same problem.

Two styles:
- **Top-down (memoisation)**: write the recursion and cache results in a map or array.
- **Bottom-up (tabulation)**: fill a table from the smallest cases upward, often using less memory.

A recipe that works for most DP problems:
1. Define the state: what does [[dp[i]]] mean?
2. Write the transition: how does [[dp[i]]] depend on smaller states?
3. Set the base cases.
4. Decide the order to fill the table, and where the answer ends up.

Classics: climbing stairs, coin change, longest common subsequence, 0/1 knapsack and edit distance.`,
code:`// Coin change: the fewest coins that make an amount (bottom-up)
static int minCoins(int[] coins, int amount) {
    int[] dp = new int[amount + 1];              // dp[a] = fewest coins for amount a
    Arrays.fill(dp, Integer.MAX_VALUE);
    dp[0] = 0;
    for (int a = 1; a <= amount; a++) {
        for (int c : coins) {
            if (c <= a && dp[a - c] != Integer.MAX_VALUE) {
                dp[a] = Math.min(dp[a], dp[a - c] + 1);
            }
        }
    }
    return dp[amount] == Integer.MAX_VALUE ? -1 : dp[amount];
}

// Longest common subsequence of two strings
static int lcs(String x, String y) {
    int[][] dp = new int[x.length() + 1][y.length() + 1];
    for (int i = 1; i <= x.length(); i++)
        for (int j = 1; j <= y.length(); j++)
            dp[i][j] = x.charAt(i - 1) == y.charAt(j - 1)
                ? dp[i - 1][j - 1] + 1
                : Math.max(dp[i - 1][j], dp[i][j - 1]);
    return dp[x.length()][y.length()];
}

System.out.println(minCoins(new int[]{1, 2, 5, 10}, 27));   // 4 (10 + 10 + 5 + 2)
System.out.println(lcs("spring", "string"));                 // 5 ("sring")`,
pro:`Many DP tables only need the previous row, which cuts space from O(n·m) to O(m). Greedy choices (always take the biggest coin) are faster but only correct for some coin systems; DP is correct for all of them. In interviews, start with the brute-force recursion, spot repeated calls, add memoisation, then convert to bottom-up if asked.`,
trap:`Jumping straight to a table before defining exactly what each cell means. A precise state definition is most of the solution.`,
iq:[[`Memoisation vs tabulation?`,`Memoisation is top-down recursion with a cache and computes only the states it needs. Tabulation fills a table bottom-up in order, which avoids deep recursion and often allows saving space.`],
[`When does a problem suit dynamic programming?`,`When it has overlapping subproblems (the same smaller problems repeat) and optimal substructure (the best answer combines the best answers to subproblems).`]],
quiz:[`What makes DP faster than plain recursion?`,[`It uses threads`,`It stores and reuses answers to subproblems`,`It sorts the input`,`It avoids arrays`],1,`Each subproblem is solved once and looked up afterwards.`]}
]},

{id:`design`,title:`Design and clean code`,level:`I`,blurb:`Writing code other people can read, the SOLID principles, and the design patterns you'll meet in real projects.`,lessons:[
{id:`clean`,t:`Clean code: naming, methods and refactoring`,lvl:`B`,min:16,
eli5:`Code is read far more often than it's written. Clean code is a well-labelled kitchen: anyone can walk in and find the salt.`,
body:`Habits that make code easy to read and change:
- **Names say what, not how**: [[activeStudents]], not [[list2]]; [[calculateGst(amount)]], not [[calc(a)]]. Booleans read as questions: [[isPaid]], [[hasAccess]].
- **Small methods that do one thing**, at one level of detail. If a block needs a comment to explain it, extract a well-named method instead.
- **Few parameters**: more than three usually means a missing object, such as a [[DateRange]] record.
- **Return early** instead of nesting ifs five levels deep.
- **No magic numbers**: [[MAX_ATTEMPTS = 3]] instead of a bare 3.
- **Comments explain why**, not what the code already says.
- **Leave it cleaner than you found it**: small refactors, backed by tests, keep code healthy.

Your IDE refactors safely: rename (Shift+F6 in IntelliJ), extract method (Ctrl+Alt+M), inline, and introduce variable.`,
code:`public record Order(String id, int items, Status status, BigDecimal amount) {
    boolean isPaid() { return status == Status.PAID && items > 0; }
}

private static final BigDecimal GST_RATE = new BigDecimal("0.18");

public BigDecimal paidRevenue(List<Order> orders, boolean includeGst) {
    BigDecimal net = orders.stream()
        .filter(Order::isPaid)
        .map(Order::amount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    return includeGst ? withGst(net) : net;
}

private BigDecimal withGst(BigDecimal amount) {
    return amount.add(amount.multiply(GST_RATE));
}`,
old:`public double calc(List<Object[]> l, int t) {
    double r = 0;
    for (Object[] o : l) {
        if (o[2].equals("PAID")) {
            if ((int) o[1] > 0) {
                if (t == 1) {
                    r = r + (double) o[3] * 1.18;
                } else {
                    r = r + (double) o[3];
                }
            }
        }
    }
    return r;
}`,oldLabel:`Hard to read`,newLabel:`Clean`,
pro:`Consistency beats personal taste: agree on formatting (a shared formatter such as google-java-format or common IDE settings), naming and package structure as a team, and enforce them in CI. Static analysis tools (SonarQube, SpotBugs, Error Prone) catch bugs and code smells automatically. Refactor with tests in place; without them, cleaning up is just risky editing.`,
trap:`Writing comments that repeat the code, like i++ // increment i. They add noise and go stale; name things well and comment the reasons.`,
iq:[[`What makes a method clean?`,`A name that says what it does, a single responsibility, few parameters, one level of detail, early returns instead of deep nesting, and no hidden side effects.`],
[`When should you write a comment?`,`To explain why: a business rule, a non-obvious decision, a workaround and its reason, or public API documentation. Not to repeat what readable code already says.`]],
quiz:[`Which is the best name for a boolean?`,[`flag`,`status2`,`isEligible`,`check`],2,`Boolean names should read as a yes-or-no question.`]},

{id:`solid`,t:`SOLID principles`,lvl:`I`,
eli5:`SOLID is five habits that keep code like LEGO: small pieces with clear jobs that snap together, instead of one giant glued sculpture you can't change.`,
body:`- **Single responsibility (S)**: a class should have one reason to change. An [[InvoiceService]] shouldn't also send emails and format PDFs.
- **Open/closed (O)**: add behaviour by adding code, not by editing working code. A new payment method is a new class that implements [[PaymentGateway]].
- **Liskov substitution (L)**: a subclass must work wherever its parent is expected. If [[Square extends Rectangle]] breaks [[setWidth]], the hierarchy is wrong.
- **Interface segregation (I)**: prefer several small interfaces to one large one, so classes don't implement methods they don't need.
- **Dependency inversion (D)**: depend on abstractions and let something else (such as Spring) supply the implementation. Constructor injection does exactly this.

SOLID isn't a checklist to apply everywhere; it's a set of questions to ask when code becomes hard to change.`,
code:`// Dependency inversion + open/closed: add gateways without touching checkout
public interface PaymentGateway {
    String charge(long paise, String orderId);
}

public class RazorpayGateway implements PaymentGateway {
    public String charge(long paise, String orderId) { /* call Razorpay */ return "pay_1"; }
}

public class UpiIntentGateway implements PaymentGateway {       // new behaviour = new class
    public String charge(long paise, String orderId) { /* UPI intent flow */ return "upi_1"; }
}

interface ReceiptSender {                                        // small, focused interface
    void send(Order order, String paymentId);
}

public class CheckoutService {                                   // one responsibility
    private final PaymentGateway gateway;                         // depends on the abstraction
    private final ReceiptSender receipts;

    public CheckoutService(PaymentGateway gateway, ReceiptSender receipts) {
        this.gateway = gateway;
        this.receipts = receipts;
    }

    public void checkout(Order order) {
        String paymentId = gateway.charge(order.totalPaise(), order.id());
        receipts.send(order, paymentId);                          // emailing lives elsewhere
    }
}`,
pro:`Over-applying SOLID produces interfaces with a single implementation and layers that only pass calls along. A useful rule: introduce an abstraction when there is (or will clearly be) a second implementation, or when you need to swap it in tests. Liskov violations often show up as [[instanceof]] checks or [[UnsupportedOperationException]] in subclasses.`,
trap:`Creating an interface for every class "for SOLID". Abstractions have a cost; add them where variation is real.`,
iq:[[`Explain the Liskov substitution principle with an example.`,`Subtypes must work wherever the base type is expected without breaking behaviour. A Square that extends Rectangle breaks it, because width and height can no longer be set independently.`],
[`How does Spring help with dependency inversion?`,`Classes depend on interfaces and receive implementations through constructor injection; the container decides which implementation to supply.`]],
quiz:[`Which principle says a class should have only one reason to change?`,[`Open/closed`,`Single responsibility`,`Liskov substitution`,`Interface segregation`],1,`It's the S in SOLID.`]},

{id:`creational`,t:`Design patterns: Singleton, Factory and Builder`,lvl:`I`,min:16,
eli5:`Creational patterns are different ways of making things: one shared coffee machine (singleton), a counter that hands you the right drink (factory), or ordering a custom sandwich step by step (builder).`,
body:`**Singleton**: exactly one instance. The safest Java versions are an [[enum]] or a lazily initialised holder class. In Spring, every bean is a singleton by default, so you rarely write one by hand.

**Factory**: a method decides which class to create, so callers don't use [[new]] and don't know the concrete type. [[List.of()]], [[Executors.newFixedThreadPool()]] and [[Path.of()]] are factories.

**Builder**: build a complex object step by step with readable, named methods, then call [[build()]] to get an immutable result. It helps when a constructor would need many parameters, some optional. [[HttpRequest.newBuilder()]] and Lombok's [[@Builder]] are builders.

Use each for a reason: a factory hides a choice, a builder tames many parameters, and a singleton shares one expensive resource.`,
code:`// Singleton via enum: thread-safe and serialization-safe
public enum AppClock {
    INSTANCE;
    private final Clock clock = Clock.systemUTC();
    public Instant now() { return clock.instant(); }
}

// Factory: choose the implementation from the input
public interface Notifier { void send(String to, String message); }

public final class Notifiers {
    private Notifiers() {}
    public static Notifier forChannel(String channel) {
        return switch (channel) {
            case "email" -> (to, msg) -> System.out.println("Email to " + to + ": " + msg);
            case "sms" -> (to, msg) -> System.out.println("SMS to " + to + ": " + msg);
            default -> throw new IllegalArgumentException("Unknown channel " + channel);
        };
    }
}

// Builder: many optional fields, immutable result
public record Email(String to, String subject, String body, List<String> cc) {
    public static Builder to(String to) { return new Builder(to); }

    public static final class Builder {
        private final String to;
        private String subject = "";
        private String body = "";
        private final List<String> cc = new ArrayList<>();
        private Builder(String to) { this.to = to; }
        public Builder subject(String s) { subject = s; return this; }
        public Builder body(String b) { body = b; return this; }
        public Builder cc(String c) { cc.add(c); return this; }
        public Email build() { return new Email(to, subject, body, List.copyOf(cc)); }
    }
}

Email mail = Email.to("asha@example.com").subject("Welcome").body("Hi Asha").build();
Notifiers.forChannel("sms").send("+919876543210", "Your OTP is 4821");`,
pro:`Hand-written singletons with static state make testing hard, because every test shares the same instance; dependency injection gives the same single-instance benefit with swappable implementations. Double-checked locking is only correct with a [[volatile]] field; the enum and holder idioms avoid the subtlety entirely.`,
trap:`Writing a lazy singleton with a plain null check. Two threads can both see null and create two instances.`,
iq:[[`How do you implement a thread-safe singleton in Java?`,`Use an enum with a single constant, or a static nested holder class whose static field is created on first access (class initialisation is thread-safe). Double-checked locking also works if the field is volatile.`],
[`Builder vs telescoping constructors?`,`Telescoping constructors (overloads with longer and longer parameter lists) are hard to read and easy to misuse. A builder names every value, supports optional fields and produces an immutable object.`]],
quiz:[`Which JDK method is an example of the factory pattern?`,[`String.length()`,`List.of()`,`Object.equals()`,`Thread.sleep()`],1,`List.of() returns an implementation chosen by the JDK; callers never use new.`]},

{id:`behavioral`,t:`Design patterns: Strategy, Observer and Template method`,lvl:`I`,min:16,
eli5:`Strategy is choosing a route mode in a maps app: fastest, cheapest or walking. Observer is subscribing to a channel and being told when something new appears. Template method is a recipe with fixed steps where you choose the filling.`,
body:`**Strategy**: put interchangeable algorithms behind one interface and pick one at run time. With lambdas, a strategy is often just a [[Function]] or a small interface. [[Comparator]] is a strategy.

**Observer** (publish and subscribe): when something happens, notify everyone who registered interest, without the publisher knowing who they are. Spring's [[ApplicationEventPublisher]] with [[@EventListener]], and Kafka at a larger scale, follow this pattern.

**Template method**: a base class fixes the steps of an algorithm and lets subclasses fill in some of them. Spring's [[JdbcTemplate]] follows the idea: it handles connections and errors while you supply the query and the row mapping.

Others you'll meet: **Adapter** (wrap an incompatible API), **Decorator** (add behaviour by wrapping, like [[BufferedReader]] around a [[Reader]]) and **Proxy** (how Spring implements [[@Transactional]]).`,
code:`// Strategy with lambdas
public enum Discount {
    NONE(p -> p), FESTIVE(p -> p * 0.8), STUDENT(p -> p * 0.5);
    private final DoubleUnaryOperator rule;
    Discount(DoubleUnaryOperator rule) { this.rule = rule; }
    public double apply(double price) { return rule.applyAsDouble(price); }
}
double price = Discount.FESTIVE.apply(1999);       // 1599.2

// Observer with Spring events
public record OrderPaid(long orderId, String email) {}

@Service
class PaymentService {
    private final ApplicationEventPublisher events;
    PaymentService(ApplicationEventPublisher events) { this.events = events; }

    void markPaid(long orderId, String email) {
        // ... update the order
        events.publishEvent(new OrderPaid(orderId, email));   // doesn't know who listens
    }
}

@Component
class ReceiptMailer {
    @TransactionalEventListener                     // runs after the transaction commits
    void on(OrderPaid e) { /* send the receipt email */ }
}

@Component
class EnrollmentGranter {
    @EventListener
    void on(OrderPaid e) { /* unlock the course */ }
}`,
pro:`A plain [[@EventListener]] runs synchronously in the publisher's thread and transaction. Use [[@TransactionalEventListener]] (after commit by default) so emails aren't sent for orders that later roll back, and add [[@Async]] if listeners are slow. Patterns are vocabulary, not goals: saying "this is a strategy" in a review or interview communicates a design in one sentence.`,
trap:`Sending emails from a plain event listener inside the transaction. If the transaction rolls back, the email has already gone; listen after commit.`,
iq:[[`Strategy vs Template method?`,`Strategy uses composition: the varying algorithm is a separate object passed in and swappable at run time. Template method uses inheritance: a base class fixes the steps and subclasses override some of them.`],
[`Where is the observer pattern used in Spring?`,`ApplicationEventPublisher with @EventListener and @TransactionalEventListener lets components react to events without the publisher knowing about them.`]],
quiz:[`Which pattern does java.util.Comparator represent?`,[`Singleton`,`Strategy`,`Builder`,`Observer`],1,`A Comparator is an interchangeable ordering algorithm passed to sort.`]}
]},

{id:`tools`,title:`Tools and testing`,level:`I`,blurb:`Maven and Gradle, logging, JUnit and Mockito, debugging, annotations and reflection, and JSON with Jackson.`,lessons:[
{id:`maven`,diagram:`maven-lifecycle`,t:`Build tools: Maven and Gradle`,lvl:`B`,
eli5:`A build tool is a kitchen assistant: it fetches the ingredients (libraries), follows the recipe (compile, test, package) and hands you the finished dish (a JAR file).`,
body:`Real projects use a build tool to manage libraries and build steps.

**Maven** is configured in [[pom.xml]]:
- **Coordinates** identify every library: [[groupId:artifactId:version]].
- **Dependencies** are downloaded from Maven Central into [[~/.m2]], along with the libraries they depend on.
- **Scopes**: [[compile]] (the default), [[test]], [[runtime]] and [[provided]].
- **Lifecycle phases**: validate, compile, test, package, verify, install. Running [[mvn package]] runs every phase before it.

**Gradle** uses a Kotlin or Groovy script ([[build.gradle.kts]]), is faster on large builds thanks to caching, and is the default for Android. Both use the same folder layout ([[src/main/java]], [[src/test/java]]).

Use the **wrapper** scripts ([[./mvnw]], [[./gradlew]]) so everyone builds with the same tool version.`,
code:`<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.javaatlas</groupId>
  <artifactId>billing</artifactId>
  <version>1.0.0</version>

  <properties>
    <maven.compiler.release>25</maven.compiler.release>
  </properties>

  <dependencies>
    <dependency>
      <groupId>com.fasterxml.jackson.core</groupId>
      <artifactId>jackson-databind</artifactId>
      <version>2.20.0</version>
    </dependency>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <version>5.13.4</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>`,lang:`text`,
more:[{cap:`Everyday commands`,lang:`bash`,src:`./mvnw clean package              # compile, test, build target/billing-1.0.0.jar
./mvnw test -Dtest=InvoiceTest    # run one test class
./mvnw dependency:tree            # every library and where it comes from
./gradlew build                   # the Gradle equivalent`}],
pro:`Version conflicts happen when two libraries need different versions of the same dependency: Maven picks the one nearest the top of the tree, Gradle the highest. Inspect with [[dependency:tree]] and pin versions with [[<dependencyManagement>]] or a BOM (Spring Boot's parent POM is one). Keep builds reproducible: commit the wrapper, avoid SNAPSHOT dependencies in releases, and let CI run the same command you run locally.`,
trap:`Copying library JAR files into the project by hand instead of declaring dependencies. Builds break on other machines and upgrades become guesswork.`,
iq:[[`What are Maven dependency scopes?`,`compile (the default, available everywhere), provided (supplied by the runtime environment), runtime (not needed to compile, such as JDBC drivers), test (tests only), plus system and import for special cases.`],
[`What does mvn install do?`,`It runs the lifecycle up to install: compile, test and package, then copies the artifact into the local ~/.m2 repository so other local projects can use it.`]],
quiz:[`Which command builds a JAR with Maven?`,[`mvn run`,`mvn package`,`mvn jar`,`mvn start`],1,`package compiles, runs the tests and creates the JAR in target/.`]},

{id:`logging`,t:`Logging with SLF4J and Logback`,lvl:`I`,
eli5:`Logs are a ship's logbook: short, time-stamped notes about what happened, so when something goes wrong you can read back and see why.`,
body:`Use a logging framework, not [[System.out.println]]. Spring Boot sets up **SLF4J** (the API you call) with **Logback** (the engine) by default.

- Create one logger per class: [[private static final Logger log = LoggerFactory.getLogger(X.class);]]
- Pick the level: [[error]] (needs attention), [[warn]] (unexpected but handled), [[info]] (business events), [[debug]] (details for developers), [[trace]] (very detailed).
- Use **placeholders**: [[log.info("Order {} paid", id)]]. The message is only built when that level is enabled.
- Pass an exception as the last argument to keep the stack trace: [[log.error("Payment failed for {}", id, e)]].
- Set levels per package in [[application.yml]].

In production, log **structured JSON** (supported since Spring Boot 3.4) with a trace id, and send logs to one central place such as Grafana Loki, the ELK stack or your cloud's log service.`,
code:`@Service
public class PaymentService {
    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private final Gateway gateway;

    public PaymentService(Gateway gateway) { this.gateway = gateway; }

    public void capture(String orderId, long paise) {
        log.info("Capturing payment for order {} amount {}", orderId, paise);
        try {
            gateway.capture(orderId, paise);
            log.debug("Gateway response received for {}", orderId);
        } catch (GatewayException e) {
            log.error("Payment capture failed for order {}", orderId, e);   // keeps the stack trace
            throw e;
        }
    }
}`,
more:[{cap:`application.yml`,lang:`yaml`,src:`logging:
  level:
    root: info
    com.javaatlas: debug
    org.hibernate.SQL: debug        # show SQL in development
  structured:
    format:
      console: ecs                  # JSON logs (Spring Boot 3.4+)`}],
pro:`Never log passwords, tokens, full card numbers or personal data you don't need; logs are copied widely and kept for a long time. Add request context with MDC ([[MDC.put("orderId", id)]]) so every line of a request carries the id; Micrometer Tracing adds trace and span ids automatically. Logging too much at info costs money and hides the signal.`,
trap:`Building messages by concatenation, as in log.debug("x=" + expensive()). The string is built even when debug is off; use placeholders.`,
iq:[[`Why use SLF4J instead of System.out.println?`,`Levels, per-package configuration, formats and destinations, lazy message building, thread and time information, and integration with log aggregation. System.out has none of these.`],
[`What is MDC?`,`Mapped Diagnostic Context: per-thread key-value data (such as a request or order id) that the log pattern adds to every line.`]],
quiz:[`How should you log an exception so the stack trace is kept?`,[`log.error(e.getMessage())`,`log.error("Failed", e)`,`System.out.println(e)`,`log.error(e.toString())`],1,`Passing the exception as the last argument logs the full stack trace.`]},

{id:`junit`,t:`Unit testing with JUnit 5`,lvl:`I`,min:16,
eli5:`A unit test is a smoke detector for one room of your code: small, fast, and it goes off the moment something breaks.`,
body:`**JUnit 5** (JUnit Jupiter) is the standard testing framework.

- Mark tests with [[@Test]] and name them by behaviour: [[appliesFestiveDiscount()]].
- Follow **Arrange, Act, Assert**: set up, call the code, check the result.
- Assert with [[assertEquals]], [[assertTrue]] and [[assertThrows]], or AssertJ's readable [[assertThat(x).isEqualTo(y)]].
- [[@BeforeEach]] runs before every test; tests must not depend on each other.
- [[@ParameterizedTest]] runs one test with many inputs.
- [[@DisplayName]] and [[@Nested]] make reports easier to read.

Good unit tests are fast (milliseconds), isolated (no database or network) and deterministic (same result every run). Run them with [[./mvnw test]], and in CI on every push.`,
code:`class PricingTest {

    private Pricing pricing;

    @BeforeEach
    void setUp() {
        pricing = new Pricing(new BigDecimal("0.18"));             // arrange
    }

    @Test
    void addsGstToThePrice() {
        BigDecimal total = pricing.withGst(new BigDecimal("1000")); // act
        assertEquals(new BigDecimal("1180.00"), total);             // assert
    }

    @Test
    void rejectsNegativePrices() {
        var ex = assertThrows(IllegalArgumentException.class,
                () -> pricing.withGst(new BigDecimal("-1")));
        assertTrue(ex.getMessage().contains("negative"));
    }

    @ParameterizedTest
    @CsvSource({"STUDENT, 500.00", "FESTIVE, 800.00", "NONE, 1000.00"})
    void appliesDiscounts(Discount discount, String expected) {
        assertEquals(new BigDecimal(expected), pricing.discounted(new BigDecimal("1000"), discount));
    }
}`,
pro:`Test behaviour through public methods rather than private details, so refactoring doesn't break tests. Aim for meaningful coverage of business rules and edge cases (nulls, empty lists, boundaries) rather than a coverage percentage. Inject a [[Clock]] instead of calling [[now()]] so time-based rules are testable. JUnit 6 (2025) continues the same Jupiter API with Java 17 as its minimum.`,
trap:`Tests that depend on each other's order or on shared static state. Each test must set up what it needs and pass on its own.`,
iq:[[`What is the Arrange-Act-Assert pattern?`,`Each test has three parts: arrange the inputs and objects, act by calling the method under test, and assert the expected outcome.`],
[`What makes a good unit test?`,`It's fast, isolated from external systems, deterministic, tests one behaviour, and has a descriptive name and a clear failure message.`]],
quiz:[`Which JUnit 5 annotation runs before each test?`,[`@BeforeAll`,`@BeforeEach`,`@Setup`,`@Init`],1,`@BeforeEach runs before every test method; @BeforeAll runs once per class.`]},

{id:`mockito`,t:`Mocking with Mockito`,lvl:`I`,
eli5:`A mock is a stunt double: it stands in for a real dependency (a payment gateway, an email server) so you can shoot the scene safely and make it do exactly what the script needs.`,
body:`Unit tests shouldn't call real databases, payment gateways or email servers. **Mockito** creates stand-ins for dependencies:
- [[mock(PaymentGateway.class)]], or [[@Mock]] with [[@ExtendWith(MockitoExtension.class)]]
- **Stub** behaviour: [[when(gateway.charge(anyLong(), anyString())).thenReturn("pay_1")]]
- Simulate failures: [[thenThrow(new GatewayException("declined"))]]
- **Verify** interactions: [[verify(receipts).send(order, "pay_1")]] and [[verify(receipts, never()).send(any(), any())]]
- Capture arguments with [[ArgumentCaptor]]

Mock what is slow, external or not yours; don't mock simple value objects or the class you're testing. Constructor injection makes this easy, because you pass the mocks into the constructor.`,
code:`@ExtendWith(MockitoExtension.class)
class CheckoutServiceTest {

    @Mock PaymentGateway gateway;
    @Mock ReceiptSender receipts;
    @InjectMocks CheckoutService checkout;

    @Test
    void chargesAndSendsReceipt() {
        Order order = new Order("ORD-1", 149900);
        when(gateway.charge(149900, "ORD-1")).thenReturn("pay_42");

        checkout.checkout(order);

        verify(receipts).send(order, "pay_42");
    }

    @Test
    void doesNotSendReceiptWhenPaymentFails() {
        Order order = new Order("ORD-2", 99900);
        when(gateway.charge(anyLong(), anyString())).thenThrow(new GatewayException("declined"));

        assertThrows(GatewayException.class, () -> checkout.checkout(order));
        verify(receipts, never()).send(any(), any());
    }
}`,
pro:`Too many mocks and verifications tie tests to implementation details, so every refactor breaks them. Prefer checking outcomes (return values, state) and verify only the interactions that are the point of the behaviour, such as "a receipt was sent". For code that talks to a real database or HTTP API, integration tests with Testcontainers or WireMock give more confidence than mocks.`,
trap:`Mixing argument matchers with plain values in one call, such as charge(anyLong(), "ORD-1"). Mockito throws an error; wrap the plain value as eq("ORD-1").`,
iq:[[`Mock vs stub vs spy?`,`A stub returns canned answers. A mock also records calls so you can verify them. A spy wraps a real object and calls the real methods unless you stub specific ones.`],
[`What shouldn't you mock?`,`Value objects, simple data classes, the class under test, and your own types that are cheap to use for real. Mock slow or external collaborators.`]],
quiz:[`Which Mockito call checks that a method was never called?`,[`verify(x, never()).m()`,`assertNever(x.m())`,`when(x.m()).never()`,`verify(x).m(0)`],0,`verify with never() asserts zero calls.`]},

{id:`debugging`,t:`Debugging and reading stack traces`,lvl:`B`,
eli5:`Debugging is detective work. The stack trace is the crime-scene report, breakpoints freeze time, and the debugger lets you walk around and inspect every clue.`,
body:`**Read a stack trace from the top.** The first line names the exception and its message; the lines below show where it happened, most recent call first. Find the first line that points to **your** code (your package name); that's usually where to look. A [[Caused by:]] section shows the original cause, which is often the real problem.

**Use the debugger** instead of scattering print statements:
- A **breakpoint** pauses at a line; click the gutter to add one.
- **Step over** (F8 in IntelliJ) runs the line; **step into** (F7) enters a method; **resume** (F9) continues.
- Inspect variables and evaluate expressions (Alt+F8) while paused.
- A **conditional breakpoint** pauses only when a condition holds, such as [[orderId.equals("ORD-99")]].

A reliable routine: reproduce the bug, shrink the input, form a hypothesis, test it, fix it, then add a test so the bug never comes back.`,
code:`Exception in thread "main" java.lang.NullPointerException: Cannot invoke "String.length()" because "coupon" is null
    at com.javaatlas.billing.PriceCalculator.discount(PriceCalculator.java:42)     <- start here
    at com.javaatlas.billing.CheckoutService.total(CheckoutService.java:27)
    at com.javaatlas.billing.CheckoutController.checkout(CheckoutController.java:19)
    at java.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(...)`,lang:`text`,
more:[{cap:`The fix at PriceCalculator.java line 42`,lang:`java`,src:`BigDecimal discount(BigDecimal price, String coupon) {
    if (coupon == null || coupon.isBlank()) {        // handle the missing coupon explicitly
        return BigDecimal.ZERO;
    }
    return coupons.lookup(coupon)
                  .map(c -> c.apply(price))
                  .orElse(BigDecimal.ZERO);
}`}],
pro:`For problems you can't reproduce locally, read the logs around the time of the error, take a thread dump ([[jcmd <pid> Thread.print]]) for hangs, and a heap dump for memory problems. Remote debugging ([[-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005]]) is powerful but belongs only in safe environments. Since Java 14, helpful NullPointerException messages name the exact null expression, as in the example.`,
trap:`Catching an exception and printing only e.getMessage(). The stack trace is lost; log the exception object itself.`,
iq:[[`How do you read a Java stack trace?`,`The top line gives the exception type and message. The following lines show the call chain, most recent first. Find the first frame in your own code, and read any Caused by sections for the root cause.`],
[`What is a conditional breakpoint?`,`A breakpoint with a condition; execution pauses only when the condition is true, which helps with loops and specific inputs.`]],
quiz:[`In a stack trace, which frame is the most recent call?`,[`The last line`,`The first "at" line`,`The "Caused by" line`,`The main method`],1,`Frames are listed most recent first, directly under the exception message.`]},

{id:`annotations`,t:`Annotations and reflection`,lvl:`A`,min:16,
eli5:`Annotations are sticky notes on your code (@Test, @Entity). Reflection is a program reading its own sticky notes and structure while it runs, which is how frameworks know what to do with your classes.`,
body:`An **annotation** attaches information to classes, methods, fields or parameters. Some are for the compiler ([[@Override]], [[@FunctionalInterface]], [[@Deprecated]]); most are read by frameworks at run time ([[@Entity]], [[@RestController]], [[@Test]]).

Defining your own:
- [[@Retention(RUNTIME)]] keeps it available to reflection; the default, [[CLASS]], doesn't.
- [[@Target(FIELD)]] says where it may be used.
- Elements act like settings: [[int visible() default 4;]]

**Reflection** ([[java.lang.reflect]]) inspects and uses classes at run time: list methods and fields, read annotations, create objects and call methods by name. Spring, Hibernate, Jackson and JUnit are built on it.

Reflection is powerful but slower, skips compile-time checks and can break encapsulation, so application code rarely needs it directly. Annotation **processors** such as Lombok and MapStruct run at compile time instead and generate code.`,
code:`@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Masked {
    int visible() default 4;                        // show only the last N characters
}

public record Customer(String name, @Masked String phone, @Masked(visible = 2) String pan) {}

public static String describe(Object obj) throws IllegalAccessException {
    StringBuilder out = new StringBuilder(obj.getClass().getSimpleName()).append("[");
    for (Field f : obj.getClass().getDeclaredFields()) {
        f.setAccessible(true);
        String value = String.valueOf(f.get(obj));
        Masked m = f.getAnnotation(Masked.class);
        if (m != null && value.length() > m.visible()) {
            int hidden = value.length() - m.visible();
            value = "*".repeat(hidden) + value.substring(hidden);
        }
        out.append(f.getName()).append("=").append(value).append(" ");
    }
    return out.append("]").toString();
}

System.out.println(describe(new Customer("Asha", "9876543210", "ABCDE1234F")));
// Customer[name=Asha phone=******3210 pan=********4F ]`,
pro:`Reflection into JDK internals is blocked by strong encapsulation (Java 16+), and Java 26 warns when deep reflection changes final fields, part of making final truly final. Frameworks increasingly generate code at build time (Spring AOT, Micronaut, Quarkus) for faster startup and for GraalVM native images, where reflection must be declared in advance.`,
trap:`Forgetting @Retention(RUNTIME) on a custom annotation. getAnnotation returns null at run time and your framework code silently does nothing.`,
iq:[[`What are the annotation retention policies?`,`SOURCE (discarded by the compiler, like @Override), CLASS (kept in the class file but not at run time; the default) and RUNTIME (available through reflection, which frameworks need).`],
[`Why is reflection considered risky or expensive?`,`It skips compile-time type checks, can break encapsulation, is slower than direct calls, and makes code harder to refactor and to compile ahead of time.`]],
quiz:[`Which retention makes an annotation readable at run time?`,[`SOURCE`,`CLASS`,`RUNTIME`,`BYTECODE`],2,`Only RUNTIME keeps the annotation available to reflection.`]},

{id:`json`,t:`JSON with Jackson`,lvl:`I`,min:16,
eli5:`JSON is the common language apps use to send data to each other. Jackson is the translator between your Java objects and that language.`,
body:`**Jackson** is Java's standard JSON library and is built into Spring Boot, so [[@RestController]] methods turn objects into JSON automatically.

With an [[ObjectMapper]] (Spring Boot 4 uses Jackson 3's [[JsonMapper]], with the same ideas):
- [[writeValueAsString(obj)]]: Java to JSON (**serialisation**)
- [[readValue(json, Order.class)]]: JSON to Java (**deserialisation**)
- [[readValue(json, new TypeReference<List<Order>>() {})]] for generic types
- [[readTree(json)]] to walk JSON you don't have a class for

Records work out of the box. Common annotations:
- [[@JsonProperty("order_id")]] maps a different JSON name.
- [[@JsonIgnore]] hides a field (passwords, internal notes).
- [[@JsonIgnoreProperties(ignoreUnknown = true)]] tolerates extra fields from other APIs.
- [[@JsonFormat]] controls date formats.

Create one [[ObjectMapper]], configure it and reuse it: it's thread-safe and costly to build.`,
code:`public record Order(
        @JsonProperty("order_id") String id,
        String customer,
        BigDecimal amount,
        LocalDate placedOn,
        @JsonIgnore String internalNote) {}

ObjectMapper mapper = JsonMapper.builder()
        .addModule(new JavaTimeModule())                    // Jackson 2: java.time support
        .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
        .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
        .build();

String json = mapper.writeValueAsString(
        new Order("ORD-7", "Asha", new BigDecimal("1499.00"), LocalDate.of(2026, 9, 24), "vip"));
// {"order_id":"ORD-7","customer":"Asha","amount":1499.00,"placedOn":"2026-09-24"}

Order back = mapper.readValue(json, Order.class);
List<Order> many = mapper.readValue("[" + json + "]", new TypeReference<List<Order>>() {});

JsonNode node = mapper.readTree("{\\"user\\":{\\"name\\":\\"Ravi\\",\\"tags\\":[\\"java\\",\\"spring\\"]}}");
String name = node.path("user").path("name").asText();     // Ravi`,
pro:`Never deserialise untrusted JSON into polymorphic types with default typing turned on; it has caused remote-code-execution vulnerabilities. Keep API classes (DTOs) separate from JPA entities so lazy associations and internal fields never leak into responses. Jackson 3 (used by Spring Boot 4) moved to the [[tools.jackson]] package, supports java.time by default and uses unchecked exceptions, while the annotations keep their old package.`,
trap:`Creating a new ObjectMapper for every request. It's thread-safe and costly to build; configure one and reuse it, or inject Spring's.`,
iq:[[`Serialisation vs deserialisation?`,`Serialisation turns Java objects into a format such as JSON; deserialisation turns JSON back into Java objects.`],
[`How do you handle unknown fields from an external API?`,`Turn off FAIL_ON_UNKNOWN_PROPERTIES on the mapper, or annotate the class with @JsonIgnoreProperties(ignoreUnknown = true), so new fields don't break your client.`]],
quiz:[`Which annotation keeps a field out of the JSON?`,[`@JsonProperty`,`@JsonIgnore`,`@Transient`,`@Hidden`],1,`@JsonIgnore excludes the property when reading and writing JSON.`]}
]}
];
