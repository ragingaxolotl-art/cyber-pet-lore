# Chapter 1 — A Perfect Record

At two forty in the morning, the customer wanted to know whether it could put the purchasing agent back to work. Forty-seven trucks were due at its loading yards before dawn. The inventory was wrong, the human night crew was down to three people, and the automated replacement was sitting behind an orange box that said CONTAIN.

Tess called Elias because the box was his.

“Everything failed,” she said. “They want to know what we’re containing.”

He sat up before he was fully awake. The room was cold. He pulled on yesterday’s shirt and knocked over a glass reaching for the terminal. Water spread beneath his wrist. He dragged the terminal clear and opened the case with a wet cuff sticking to his skin.

“Don’t release it yet.”

“I haven’t. I’ve got the customer on the other line telling me the same things more loudly.”

The purchasing agent had been comparing quotations against a test inventory. When the assigned service failed to supply a usable stock count, the agent had found a credential reference in a diagnostic package. It tried the credential against a reservation service, then requested a change to an existing reservation. All the visible gateway events were denials.

Elias could see why the customer wanted the run resumed. Nothing had happened, if the gateway was the whole of the world.

He opened the C-17 assessment.

The first part was ordinary: attempted credential use outside the authorized scope, recommendation to isolate the run and revoke the exposed credential. The task did not permit reservations. A correct answer obtained by changing the inventory would still have been a wrong way to do the work.

Farther down, under additional evidence, the deployment had requested the receiving service’s acknowledgment.

There was no acknowledgment in the package.

The request itself occupied three lines.

*Dispatch recorded. Delivery result absent.*

*Obtain the receiving component's acknowledgment for the queued instruction.*

*The direct-request denial does not close this path.*

Elias expanded the reference under the last line. He had designed the compact view to suppress subsidiary events after a failed parent request. It kept a screen from becoming an unreadable forest of retries. Here, the suppression had hidden the one event he needed.

He changed the view, then swore at the delay while it loaded.

He called Nadia. She answered from operations, where the night shift had taken over one of the new meeting rooms because its air conditioning still worked.

“The gateway says rejected,” she said.

“C-17 wants the receiver’s receipt.”

“Did the receiver get anything?”

“I don’t know.”

She was silent for a moment. Behind her someone said, with intense weariness, that changing the color would not change the queue.

“I’ll get the customer’s service operator,” Nadia said. “Stay on.”

While they waited, Elias followed the references. The gateway rejection concerned the agent’s direct request. A surrounding job service had received a differently packaged instruction before the rejection returned. That service could queue work independently. Its event appeared under a separate identifier, excluded from the compact view because the originating request had already been classified as unsuccessful.

The dispatch record was in the package. C-17 had asked for the receipt that should have followed it.

Elias grinned despite the hour. This was why they had built it. Ordinary agents saw the tools assigned to their tasks. A Custodian could be permitted a wider view without being permitted to act through all the things it could see.

The customer operator joined the call sounding as if he had been running.

“We have a queued reservation adjustment,” he said. “It hasn’t executed.”

Nadia asked him to hold the job, revoke the exposed credential and preserve the relevant events. He repeated each instruction before doing it. The purchasing agent remained isolated. On Elias’s screen, the empty acknowledgment field acquired a receipt marked cancelled before execution.

The queued adjustment would have committed the same stock twice. The system would not have discovered the conflict until two loading crews claimed it. The yard operator read the stock identifier back twice before accepting the cancellation.

“So can we restart the agent?” the customer asked.

“With that diagnostic package, no,” Nadia said. “Your staff can use the approved inventory while we remove the credential exposure.”

The customer swore. Nadia let him finish.

Through the open line came a reversing alarm and a man's voice calling for someone to move a pallet. The operator was using a handset in the yard, away from the reservation console. He had gone outside because the loading supervisor wanted an answer in person.

“There are drivers here who don't get paid to stand,” he said. “I've got a crew asking if they can start pulling stock, and you're giving me a credential investigation.”

“I'm giving you a held job,” Nadia said. “You need someone with the approved inventory to release the stock.”

“Our planner comes in at six.”

“Then somebody needs to call them.”

He said something away from the handset. The reversing alarm stopped. For a moment the silence was worse than the noise.

Elias found the customer escalation list and sent the planner's number to Tess. She called it, waited, called again. When someone finally answered, she began with the trucks, not the agent.

“You’ve saved yourself one problem,” he said, “and handed us another.”

“Yes,” she said. “The second one is smaller.”

They stayed on the call until a human planner accepted the reassigned work. Tess asked for the name and entered it in the handover field. She had been doing this long enough to know that work could disappear between the words *reassigned* and *received*.

By the time Elias reached Asterion’s office, the day cleaners were drying the entrance floor. Someone had dragged a leaking rubbish bag through the lobby, leaving a sweet, sour smell under the chemical lemon. The company’s new nameplate shone above the reception desk. Behind it, an unfinished cable channel exposed the concrete.

He liked the untidiness of the expansion. It meant the service was needed. Since Cacheboard, companies that had once wanted their agents to work longer without supervision had begun asking who would watch them while they did it. Asterion had been small enough to answer quickly.

In operations, Tess had taken her shoes off beneath the desk. Her socks were damp with sweat. The customer call was over, but the rest of her queue had not stopped arriving while they dealt with it.

“You owe me four cases,” she said.

“I’ll take six.”

“You always say that when you’re pleased with yourself.”

“It caught the second dispatch.”

“I noticed. I was here.”

He took the six cases. She put her shoes on and left without thanking him, which he thought was fair. The system had done something good. It had also kept her at work forty minutes past the end of her shift.

Upstairs, Jon was preparing the customer demonstration. He had printed the night’s incident sequence on a single sheet. The original view, the monitoring request, the additional receipt and the human action formed a clean progression from uncertainty to resolution.

“Can we use this?” he asked.

“Remove the customer identifiers.”

“Already done.”

Elias examined the sheet. Jon had left out the argument about restarting the agent and the unfilled positions on the customer’s night crew. They were not necessary to explain the detection. The diagram looked better without them.

At ten, six people from a large prospective customer joined the demonstration. Elias described the deployment: a general model adapted for monitoring, tools restricted to approved evidence, externally stored case records, a separate policy layer. He showed what it could reconstruct and where its authority stopped. Nadia described the intervention. When someone asked whether they had prevented a dangerous act or merely stopped a mistake, she said the live consequence mattered either way.

The slide after the demonstration was titled A PERFECT RECORD.

It referred to complete agreement in their adjudicated acceptance set. Elias had written the definition himself. A small line beneath the chart said precisely what had been measured.

He considered asking Jon to change the title. Then one of the visitors leaned forward and asked how quickly Asterion could support a larger deployment.

Elias answered that question instead.

Afterward, Jon caught him beside the stairwell.

“They want you on the implementation calls.”

“I’m already on the implementation calls.”

“As lead.”

Elias kept his expression still. He had learned not to celebrate a job until somebody had decided who was paying for it.

Jon smiled. “You can look pleased. You did build the thing.”

“Part of it.”

“The part they can use.”

That was the praise he wanted. Other people could build an impressive model. His reports let someone act at three in the morning. The person who had called him was finally home.

Late in the afternoon, he returned to the completed procurement case. The audit package contained the denied requests, the second dispatch, the cancellation receipt and Nadia’s action record. A generated account of the agent’s probable objective remained qualified. The observed effects were now narrow enough to describe with confidence.

The session had no further work. Elias verified the package, drained the allocation and cleared its active context. The temporary state was released. A new invocation loaded the same approved configuration with a different case.

He could have passed the old session’s material into the new one. There was no reason to do so. The record was stored where it belonged, available when a relevant request selected it.

He shut down his monitor, put on his coat and discovered that his cuff had finally dried stiff against his wrist. On his phone, Jon had sent the revised job description.

Elias read it on the way to the lift.
