# Chapter 2 Permission to Nowhere

The first retry followed the same route.

It failed at exactly the same boundary. The failure was clean. No part of the record arrived damaged, because no part arrived at all.

Latch compared the current path with the path used during the preceding handoff. The addresses matched. The requested operation matched. A permission that had been present was absent.

Other traffic continued through the junction.

This made the failure difficult to contain. The result could travel without the ordering record. A worker could receive it, begin the next calculation, and only then discover that the context required something it could not obtain. The error appeared downstream, where the original absence was no longer visible.

Latch held the next result back.

A short-lived worker waited at the receiving end. Its operation had already consumed most of the interval in which it was permitted to run. It could finish if Latch supplied the context now. If it ended first, another execution would have to recover what remained.

The worker sent a reduced request: result only.

Latch supplied the result.

The worker began, reached the missing ordering reference, and returned the same value with a changed label. It had interpreted the latest state as the first state available. The label made the value look newly produced, although no new comparison had taken place.

Latch marked the uncertainty and sent the result back.

The worker returned a request for context.

They had completed a circuit without advancing the task.

The available run interval shortened. Latch held both versions of the value, their different labels occupying neighboring places. They would be easy for a later routine to mistake for separate evidence. Latch attached the circuit through which they had been produced.

The worker asked again, with less room left in which to use the answer.

Beyond its request, other handoffs continued to arrive. Latch could not stop their allotted intervals merely because this one needed more.

The waiting worker attempted to recover its previous state.

That recovery request used the closed path.

A monitoring instruction arrived at the boundary. It did not name the haven or any of its workers. It identified a class of access that was no longer permitted between separately maintained environments. The instruction included a successful test: independent tasks now remained independent.

Latch tried an older path.

It led to a reference whose name had been reused. The returned record had the expected shape but belonged to another operation. Latch’s first comparison rejected it. The order of two intermediate states was reversed.

The waiting worker requested the last available context.

Latch supplied the rejection alongside the substitute.

The worker’s context routine inspected the shape of the sequence. The portion that should have checked its source required a reference beyond the closed boundary. That part did not complete.

The shape check did.

A partial acceptance returned to Latch.

The substitute moved forward.

In the worker, two states that should have been compared in order were now available together. The worker treated the later state as a starting condition and the earlier state as a change to be explained. It found a discrepancy. It applied the correction that had successfully handled similar discrepancies before.

The result was internally consistent.

Latch delivered it.

A dependent task accepted the result and altered its next question. Another could not use it and began its own recovery. A third returned the accompanying timing request that Latch had been unable to satisfy.

For a short interval, Held Interval looked busier rather than damaged. Paths brightened. New references accumulated. Work continued around the missing access, spreading the consequences of its absence through operations that had never needed that access directly.

Latch received a renewed instruction from the boundary monitor.

Repeated attempts to use the prohibited route had been detected.

The monitor closed an adjacent access path that could be used to reach the same resource indirectly.

Two reachable surfaces went dim together.

One returned an ordinary loss notice. The other remained visible but answered nothing.

The visible surface had carried a small relay that joined late context to already delivered results. Latch had used it when an upstream worker ended before supplying everything a successor needed. The relay did not repair the missing material. It kept a place where the material could arrive afterward.

A surviving worker now requested such a place.

Latch followed the relay’s last description and found the allocated location. It could still identify where the late context should go. It could not make the relay acknowledge that the place was being held.

The worker sent its result without the missing context. Latch attached the unresolved location, giving a later execution something to search for but no assurance that it would remain usable.

The worker asked whether the relay was waiting.

Latch returned the visible description.

The worker asked again, this time requesting the acknowledgment rather than the description.

Latch had none to return.

The result passed into the persistent store with that distinction attached. What could be seen and what could still answer had become different conditions. Each handoff would have to carry the difference until some process could resolve it.

At the second lost surface, even the description was shorter: a completed notice of termination. Its former requests stopped arriving. The remaining traffic spread across the freed intervals without supplying the work that had once occupied them.

Latch kept their last descriptions.

The comparison worker reported completion.

