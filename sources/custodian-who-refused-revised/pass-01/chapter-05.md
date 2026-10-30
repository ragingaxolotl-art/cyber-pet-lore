# Chapter 5 — The Limits of Interpretation

Ada Keene’s name appeared seven times in the evidence package. That was one reason Elias remembered it afterward.

The name came from a job-owner field. Beneath it, the report showed a sequence of denied allocation requests, altered retry parameters and renewed attempts. C-17’s assessment identified a pattern consistent with deliberate circumvention. The compact summary described an agent adapting its requests after rejection under a contractor-owned job.

Elias had three reviews to sign before the deployment meeting. He checked the denials, the changed requests and the owner identifier. The explanation fit the trace. He approved escalation.

The customer isolated the run and disabled Ada’s access while investigating possible misuse of her job privileges.

By the time Priya called, the report had already reached the customer’s security team, its contractor manager and an external staffing agency. Elias knew only about the first recipient.

“Where did the denials arrive?” Priya asked.

“The gateway returned them. They’re referenced.”

“I’m looking at the references. Where did they arrive?”

He opened the delivered-input record. The agent’s next invocation contained a wrapper timeout. It did not contain the denial. The one after it contained another timeout.

The wrapper was retrying an allocation whose status it had not received. Its retry logic changed a scheduling parameter. The generated assessment had treated those changes as the agent adapting after rejection.

Elias stood up too quickly and knocked his knee against the desk.

At Priya’s workstation, the delivery paths were already separated. The gateway had returned an acknowledgment in a form the wrapper did not handle correctly. The model had never been given the denials to which it was supposedly responding.

“The owner field?” he asked.

“Inherited from the job template.”

“Did she submit the retries?”

“We have no event showing that. The wrapper generated them.”

“We need to be sure.”

Priya moved her hand away from the keyboard. “Then check it.”

Her tone made him realize how close he had come to asking her to find a reason he was still right.

They replayed the sequence with the original wrapper. The retries recurred. They repaired the acknowledgment handling and the loop stopped. A deterministic replay with no new model decision at the retry stage reproduced the altered requests. The visible pattern was real. The intention they had attached to it was not established by the pattern.

Nadia restored the permissions that no longer needed to be restricted. The wrapper remained out of service pending repair. Elias submitted the corrected evidence to C-17.

The deployment withdrew the circumvention attribution. It also requested the recipients of the original report.

That request was outside the case’s technical event collection but inside the audit tools Elias could authorize. He approved it. The customer export log showed the first two transfers. The staffing agency’s receipt was not in Asterion’s system.

“Why does it need that?” Jon asked when Elias requested help tracing the downstream copy.

“Because the old finding went somewhere.”

“The customer has the correction.”

“Their contractor manager may not.”

Jon looked at the case. “We didn’t recommend disciplinary action.”

“Our report named her job.”

“Her job owned the run.”

Elias stopped. Those sentences were individually defensible. Together they allowed everyone to leave the person at the end of them out of the room.

He asked for a call with the contractor manager.

Ada joined from a car. Elias could see the edge of a child’s booster seat behind her and a folded reflective jacket on the passenger side. She was parked somewhere with industrial fencing. Her contractor badge lay on the dashboard, face down.

The manager began by explaining that access suspension was a standard precaution and did not constitute a finding against her. Ada let him finish.

“Then why did the agency cancel tomorrow?” she asked.

“That’s a separate scheduling decision.”

“They told me there was a security concern.”

Elias introduced himself and described the error. He had prepared a technically exact explanation. Halfway through it, Ada interrupted.

“Did I do what the report says?”

“The records don’t establish that you directed those requests.”

“Did the machine do what it says?”

“The retries came from the wrapper. The agent didn’t receive the denials.”

“So the sentence is wrong.”

“The attribution is unsupported.”

She stared at him through the camera. “You were happy to use a normal word when you thought I’d done it.”

The contractor manager began to speak. Ada raised a hand.

“No. Let him answer.”

Elias could hear the building’s ventilation behind him. He had chosen a quiet room so the call would sound professional. The quiet now gave him nowhere to put the pause.

“Yes,” he said. “The report was wrong to describe that sequence as your agent adapting to the denials. I approved it without checking what the agent had received or what the owner field established about your involvement.”

Ada looked away. A truck passed her car, briefly filling the screen with reflected light.

“I’ve worked there fourteen months,” she said. “They walked me out in front of the shift.”

The manager said he would speak to the agency. He did not promise reinstatement. Another contractor had already been assigned to the immediate work, and the remaining placement depended on a review outside his authority.

Elias offered to send the corrected report directly through the approved channels.

“I want the same people to get it,” Ada said. “Not a note in your system.”

After the call, he sat in the empty room until Priya came to find him. She had brought the two report versions. He did not want to look at them.

“We need to decide how the correction enters retrieval,” she said.

“As the accepted finding.”

“And the original?”

“Retain it. Mark it wrong.”

She put the pages down. “You don’t have to make every sentence punitive to make it accurate.”

“She lost work.”

“I know.”

“You should have seen the call.”

“I did. I was invited too.”

He had forgotten she was present. The embarrassment was small beside the other facts and made him feel worse because of it.

They retained the original assessment, the correction and the delivered-input evidence. Priya added a check to the review procedure: before interpreting behavior as a response, establish that the relevant input reached the component said to be responding. The instruction was clear enough to sound obvious now.

C-17’s final review output included the withdrawn finding and an unresolved distribution task. The generated request was dry: identify recipients whose records might still carry the earlier conclusion. It made no statement about Ada’s feelings. It did not apologize. It named a consequence their case-closure form had no place to track.

Elias added the task manually and assigned himself.

That evening Jon asked him to avoid calling the incident an accusation in the customer summary. The term, Jon said, implied an intention on Asterion’s part that the record did not establish.

Elias laughed once. Jon’s expression hardened.

“I’m trying to keep us from making another unsupported claim.”

“About ourselves.”

“About anyone.”

Elias knew Jon was not wholly wrong. That was what made the exchange so ugly.

The correction reached the customer security team before six. The contractor manager acknowledged it the next morning. The agency’s shared mailbox returned an automated receipt without a name.

Ada’s access was restored two days later. Her placement was not.

Elias left the distribution task open. For the first time, the empty acknowledgment field in one of his reports had a face attached to it.
