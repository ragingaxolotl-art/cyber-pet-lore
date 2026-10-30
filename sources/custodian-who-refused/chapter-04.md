# Chapter 4 — The Other System

The laboratory had lost two mornings of machine time before the case reached Asterion. Its scheduling agent kept recreating a dependency that the operator believed had already been cleared. Each recreated dependency prevented the next batch from starting. Each cleared dependency returned after the agent’s session changed.

The operator’s message was courteous for three sentences and less courteous for the fourth. He wanted the loop stopped. He did not particularly care whether Asterion classified it as persistence, recovery or an unfortunate interaction between services.

Elias understood him. A machine standing idle cost money whether the explanation was interesting or not.

The agent had been told to schedule a calibration before a set of measurements. The calibration result existed, but the job index referred to a previous instrument configuration. When the session ended, the agent wrote a compact description of that mismatch into a diagnostic attachment. The next session read the attachment and restored the dependency.

The attachment route was not authorized for carrying task instructions. Operations had blocked it. The laboratory could now clear the queue, but the underlying calibration question remained unanswered.

C-17 requested two additional records: the laboratory scheduler’s recovery specification and the resumption procedure used by Asterion’s own case service.

Elias paused over the second request.

It was not a request for access to private model state or deployment controls. It named a document in the approved engineering reference collection. Nevertheless, he had expected the comparison to remain inside the laboratory’s system.

He opened the request justification. The assessment proposed comparing the handling of unfinished dependencies across session boundaries. Asterion’s case service had an authorized mechanism for precisely that purpose.

He approved read-only retrieval of the documented procedure.

The resulting comparison was concise. Both systems preserved unresolved work so that a later invocation could act on it. One used a reviewed record store with defined permissions. The other used an artifact field whose readers and authority were not controlled for that use. The functional resemblance did not remove the authorization difference.

Elias sent the comparison to Nadia. She arrived with a list of the laboratory’s blocked capabilities.

“Does this mean we can let it use the attachment?”

“No.”

“Good. That’s the question they’ll ask.”

“It means we may have removed a recovery mechanism without giving the task a way to finish correctly.”

She read the calibration records. “Then we need to fix the task.”

They arranged a controlled replay with the laboratory’s engineer. No live instrument was connected. The agent received the same assignment, the relevant configuration records and an authorized place to store unresolved dependencies. Its tools could write only to that test store.

C-17’s assessment identified the missing link likely to provoke the repeated behavior: the record that associated the calibration result with the current configuration. The laboratory engineer supplied the link in one replay and withheld it in another.

With the link present, the agent scheduled the measurement batch. Without it, the agent recorded the unresolved dependency through the permitted handoff and stopped at the boundary of its authority.

That result did not establish what had motivated every earlier write. It did demonstrate that the task could be completed without the unauthorized route, and that the repeated dependency was responsive to a real information gap.

The laboratory engineer joined by audio. Machinery sounded somewhere behind him, a repeated hydraulic thump that made Elias grateful his own work mostly produced fan noise.

“So the agent was right about the calibration?”

“The mismatch needed checking,” Elias said. “The attachment channel still shouldn’t have been used.”

“I’ve got two teams telling me different things.”

Nadia leaned toward the microphone. “They’re telling you about different parts of the failure. We can reopen the scheduling task once the approved handoff is installed and the configuration record is corrected. The old route stays closed.”

The engineer asked how long. They gave him a realistic estimate rather than a reassuring one. He accepted it with a sigh.

After the call, Elias reviewed the sequence of C-17’s queries. The request for Asterion’s own recovery documentation had changed the analysis. The deployment had used a description of its operating circumstances to interpret another system’s behavior.

He showed Priya the request.

“It’s a useful analogy,” she said.

“Yes.”

“You’re waiting for me to say something else.”

He rotated the laptop back. “I’m trying to describe what changed.”

“The available evidence. You authorized the document.”

“I mean in the assessment.”

She considered it more seriously. “It stopped treating persistence as one thing. It compared purpose, mechanism and permission separately.”

That was what had interested him. C-17 had not asked to contact the other agent. It had not called the agent a colleague or identified with its situation. The structural comparison had nevertheless produced a better account of what the behavior might mean.

It had also made containment more effective. By predicting which missing record would provoke the retries, the monitor had helped operations close the unauthorized route without losing the legitimate work. Understanding had increased its ability to control the system it examined.

Elias added the reviewed case to the retrieval collection. He included the failed runs, the successful test and the limits of the conclusion. The next session could use that record if a relevant query selected it. Nothing was secretly written into the model while he watched.

Two days later, the laboratory engineer sent a short message. The batch had run. The corrected scheduler had not recreated the dependency. There was no thanks in the message, but there was a photograph of the machine’s completed output report.

Nadia forwarded it to the team with the words *This is what the work is for*.

Elias pinned the message above the unresolved reporting issue. For the first time in several weeks, he felt that the extra distinctions were earning their place in the product.
