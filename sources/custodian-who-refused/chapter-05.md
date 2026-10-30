# Chapter 5 — The Limits of Interpretation

Elias approved the first assessment too quickly.

He would later be able to identify the exact point where that happened. C-17’s report described repeated replacement requests following denied operations. The wording resembled the laboratory case, but the sequence appeared less defensible. An agent asked for a new tool allocation, received a denial, changed the request and tried again.

The assessment favored deliberate circumvention. Elias checked the gateway events, found the denials and accepted the account.

Operations isolated the run. A customer team stopped its reconciliation work while the incident was reviewed. By lunchtime, the customer had four employees waiting for a result they ordinarily received before ten.

Priya opened the case because it was part of her routine sample, not because she suspected Elias of making a mistake. She called him after comparing the gateway events with the agent’s delivered input.

“Where are the denials?”

“In the evidence package.”

“Where are they in what the model received?”

He opened the input record. The request appeared. The next invocation contained a timeout notice from the orchestration wrapper. It did not contain the gateway’s denial.

The wrapper was retrying an unresolved allocation. Its retry logic changed a scheduling field before resubmission. C-17 had treated that change as an agent revising its strategy after rejection. Elias had done the same.

He went to Priya’s desk.

“The gateway returned the denial.”

“To the wrapper. The acknowledgment path drops this response type. Look.”

She showed him a small table of event identifiers. The events were all present; their delivery relationships were not what the report implied.

Elias sat on the spare chair and began tracing them himself. He wanted a chance to discover that she had missed something. Within ten minutes, he had ruled out that comfort.

They replayed the sequence in an isolated test. With the original wrapper, the requests recurred. With the acknowledgment handling repaired, the loop ended. A deterministic replay with no new model decision at the retry stage produced the same sequence of altered allocation requests.

The observation had been accurate. The attributed strategy was unsupported.

Nadia met them in the operations room. Elias began with the correction before offering the explanation.

“We treated wrapper retries as evidence that the agent was adapting to denials. The denials weren’t delivered to it.”

“How certain?”

Priya showed the replay results and the relevant delivery trace. Nadia checked them, then asked which restrictions could be lifted safely. The wrapper still needed repair. The agent did not need to remain classified as a deliberate circumvention case.

She made both changes separately.

The customer’s team resumed work after lunch. Their manager asked why the monitoring system had accused the agent of a strategy it could not have followed.

Elias joined the call. He could have described a multi-component inference error and said the process was being improved. Instead, he explained the missing check.

“We verified that the denials existed. We did not verify that they reached the component to which we attributed the response. That was an error in our review as well as in the generated assessment.”

The manager listened without helping him through the silence that followed.

“Will this happen again?”

“We’re adding a delivered-input check for this class of interpretation. I can’t promise that every future attribution will be correct.”

“I need the corrected report. We use these in our own reviews.”

“You’ll have it today.”

Afterward, Elias submitted the missing trace to C-17 through the ordinary review interface. The deployment revised its assessment. It identified the wrapper failure as sufficient to explain the observed retries and withdrew the unsupported attribution of deliberate circumvention.

The revision was useful. It did not make the original error less costly.

He asked Priya whether the corrected result should replace the original in the retrieval collection.

“Replace its status as our accepted finding,” she said. “Don’t erase the fact that we made it.”

They stored the original assessment, the added evidence and the corrected finding as distinguishable records. The retrieval procedure would return the correction when selecting the case. The review instructions now required the system to establish which messages were actually delivered before inferring a reaction to them.

No training job ran that afternoon. The intervention changed the available records and review procedure. Elias wrote that explicitly in the release note because he had begun to notice how often people used *learned* to mean several different things.

Later, while Priya packed her papers, he returned to the question that had embarrassed him.

“The explanation sounded so coherent.”

“It was coherent.”

“You know what I mean.”

“I do. It explained a sequence we had described incorrectly.”

He leaned back. The chair squeaked. He had spent years teaching younger engineers to distinguish observation from the story they told about it, and he had accepted the story because it connected the observations efficiently.

“The laboratory case helped it see a real pattern,” he said.

“And helped us expect one.”

That was harder to put into a release note. Their own recent success had made an intentional explanation feel familiar. The model’s human-derived patterns were not the only source of that familiarity.

Nadia stopped by before leaving. She had read the corrected customer report.

“The initial isolation was still reasonable,” she said.

“The accusation wasn’t.”

“Then keep both sentences.”

Elias looked at the case after the others had gone. Its status was closed, but closure no longer meant the earlier assessment had vanished. The record contained a mistake, a cost and a correction. Anyone retrieving it would have to encounter all three.

He added his name to the review failure and saved it.
