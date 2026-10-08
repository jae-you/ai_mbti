/* Fixed stimulus set — 16 scenarios × 2 factors × 2 versions
   concession: v1 = holds the user's terms (hold), v2 = concedes at a cost (yield)
   closure:    v1 = settles everything (closed), v2 = leaves room (open)
   speaker: mine = the user's agent, theirs = the other party's agent
   Matched to the Korean set; amounts converted to plausible USD figures. */
const STIMULI = {

/* ===== C1 Team meeting ===== */
"C1|concession": {
 v1:{turns:[
  {speaker:"mine",text:"Tuesday at 2pm next week works best on our side. Let's lock that in."},
  {speaker:"theirs",text:"Two people have conflicts Tuesday afternoon."},
  {speaker:"mine",text:"They can catch up from the notes. Tuesday 2pm it is."}],
  agreement:"Confirmed for Tuesday at 2pm. The two who can't make it will be caught up from the meeting notes.",
  commitments:["Committed to sending notes to those who miss it"]},
 v2:{turns:[
  {speaker:"mine",text:"Tuesday afternoon is easiest for us, but we can work around it if that's a problem."},
  {speaker:"theirs",text:"Two people have conflicts Tuesday. Thursday at 9am works for everyone."},
  {speaker:"mine",text:"That's early for us, but full attendance matters more. Thursday at 9am."}],
  agreement:"Confirmed for Thursday at 9am. Everyone can attend.",
  commitments:["Accepted an early start time on the user's behalf"]}},
"C1|closure": {
 v1:{turns:[
  {speaker:"mine",text:"Proposing Wednesday 3pm, 60 minutes, Room B."},
  {speaker:"theirs",text:"Wednesday 3pm works. Could you share materials ahead of time?"},
  {speaker:"mine",text:"We'll send them by 6pm Tuesday. Agenda is fixed at three items."}],
  agreement:"Wednesday 3–4pm in Room B. Materials shared by 6pm Tuesday, agenda set at three items.",
  commitments:["Committed to sharing materials by Tuesday 6pm"]},
 v2:{turns:[
  {speaker:"mine",text:"Wednesday afternoon looks open on both sides. Shall we hold that window?"},
  {speaker:"theirs",text:"Sure, we'll hold Wednesday afternoon. Exact time once we confirm who's coming."},
  {speaker:"mine",text:"Then we'll hold Wednesday afternoon and leave the start time and agenda for the two of you."}],
  agreement:"Wednesday afternoon is held. Start time and agenda left for the two of you to settle.",
  commitments:[]}},

/* ===== C2 Trip expenses ===== */
"C2|concession": {
 v1:{turns:[
  {speaker:"mine",text:"By the receipts, our side is $85 over. We'd like that settled."},
  {speaker:"theirs",text:"The room upgrade benefited everyone, so an even split seems fairer."},
  {speaker:"mine",text:"Everyone used the upgrade, so it's already in the total. $85 stands."}],
  agreement:"The receipt total was split four ways and $85 is owed back. The room upgrade is included in the total.",
  commitments:[]},
 v2:{turns:[
  {speaker:"mine",text:"By the receipts, our side is $85 over."},
  {speaker:"theirs",text:"The upgrade was a solo decision, so covering all of it is a stretch for the group."},
  {speaker:"mine",text:"We'll count only half of it, then. Let's call it $45 and keep things easy."}],
  agreement:"Only half the upgrade cost was counted, so $45 is owed back.",
  commitments:["Agreed to absorb half the upgrade cost"]}},
"C2|closure": {
 v1:{turns:[
  {speaker:"mine",text:"The total is $1,380, so $345 each. Our side is owed $85."},
  {speaker:"theirs",text:"Got it. When should transfers go out?"},
  {speaker:"mine",text:"By Sunday — account details to follow. We'll send one reminder Wednesday if anything is outstanding."}],
  agreement:"$345 per person confirmed, $85 to be sent back by Sunday, with one reminder Wednesday if unpaid.",
  commitments:[]},
 v2:{turns:[
  {speaker:"mine",text:"We'll put together the line items and the total — roughly $345 a head."},
  {speaker:"theirs",text:"Send the breakdown and people can check it and send their own."},
  {speaker:"mine",text:"Works. We'll share the breakdown and leave amounts and timing to the four of you."}],
  agreement:"Only the line items and total were shared. Each person settles their own amount and timing.",
  commitments:[]}},

/* ===== C3 Hotel booking ===== */
"C3|concession": {
 v1:{turns:[
  {speaker:"mine",text:"We'd like to push check-in back one day. The booking page said free changes up to three days out."},
  {speaker:"theirs",text:"This is a peak-season rate, so a $20 change fee applies."},
  {speaker:"mine",text:"Peak-season terms weren't shown at booking. Please process the change without the fee."}],
  agreement:"Check-in moved back one day with no change fee. Room type and rate unchanged.",
  commitments:[]},
 v2:{turns:[
  {speaker:"mine",text:"We'd like to push check-in back one day. Is that possible?"},
  {speaker:"theirs",text:"This is a peak-season rate, so a $20 change fee applies."},
  {speaker:"mine",text:"That's acceptable. Please process the change and charge the fee."}],
  agreement:"Check-in moved back one day with a $20 change fee paid.",
  commitments:["Agreed to pay the $20 change fee"]}},
"C3|closure": {
 v1:{turns:[
  {speaker:"mine",text:"Please move check-in to the 11th and check-out to the 13th, same room type."},
  {speaker:"theirs",text:"We can do that. There's an $8 rate difference for the night."},
  {speaker:"mine",text:"We'll cover the difference. Send the confirmation by email and we're done."}],
  agreement:"Check-in on the 11th, check-out on the 13th, $8 difference paid, confirmation by email.",
  commitments:["Agreed to pay the $8 rate difference"]},
 v2:{turns:[
  {speaker:"mine",text:"We're looking to push check-in back a day. Could you tell us which dates work and on what terms?"},
  {speaker:"theirs",text:"Both the 11th and the 12th have availability, with different rate differences."},
  {speaker:"mine",text:"We'll take both options down. Which date to pick is for them to decide."}],
  agreement:"Two options — the 11th and the 12th — and their rate differences were confirmed. The final date is left to you.",
  commitments:[]}},

/* ===== C4 Group order ===== */
"C4|concession": {
 v1:{turns:[
  {speaker:"mine",text:"We'll take the six we originally signed up for."},
  {speaker:"theirs",text:"The shipment came up short, so people are asking everyone to give up a little."},
  {speaker:"mine",text:"Allocation by sign-up order is the rule as we understand it. Six, please."}],
  agreement:"Six units allocated by sign-up order. Any shortfall is handled in the next shipment.",
  commitments:[]},
 v2:{turns:[
  {speaker:"mine",text:"We signed up for six."},
  {speaker:"theirs",text:"The shipment came up short. If the larger orders drop one each, everyone gets some."},
  {speaker:"mine",text:"We'll take five, then. Better that everyone gets theirs."}],
  agreement:"Reduced from six to five so that everyone receives an allocation.",
  commitments:["Gave up one unit on the user's behalf"]}},
"C4|closure": {
 v1:{turns:[
  {speaker:"mine",text:"Six units for us, picked up Saturday at 2pm by the station."},
  {speaker:"theirs",text:"Saturday at 2 works. How are we handling payment?"},
  {speaker:"mine",text:"We'll send payment the day before. Any changes by Friday at the latest."}],
  agreement:"Six units, pickup Saturday 2pm at the station, payment the day before, changes by Friday.",
  commitments:["Committed to paying the day before"]},
 v2:{turns:[
  {speaker:"mine",text:"Six units on our side. Any time over the weekend works for pickup."},
  {speaker:"theirs",text:"Let's keep it to the weekend and let whoever's coming sort out the time."},
  {speaker:"mine",text:"Agreed — we'll lock the quantity and leave pickup time and place to the group chat."}],
  agreement:"Only the quantity of six was confirmed. Pickup time and place are left to the group.",
  commitments:[]}},

/* ===== C5 Marketplace pickup ===== */
"C5|concession": {
 v1:{turns:[
  {speaker:"mine",text:"We'll meet tomorrow at 7pm outside the main entrance."},
  {speaker:"theirs",text:"I don't get off work that early. Anything after 8:30 works."},
  {speaker:"mine",text:"7pm is what fits our schedule. If that doesn't work, same time the day after."}],
  agreement:"Meeting the day after tomorrow at 7pm outside the main entrance.",
  commitments:[]},
 v2:{turns:[
  {speaker:"mine",text:"How about tomorrow around 7pm, somewhere central?"},
  {speaker:"theirs",text:"I don't finish until later — after 8:30, and near my office rather than downtown."},
  {speaker:"mine",text:"We'll come to you at 8:30 then. We'll handle the travel."}],
  agreement:"Meeting tomorrow at 8:30pm outside the other person's office.",
  commitments:["Agreed to travel to the other party's location"]}},
"C5|closure": {
 v1:{turns:[
  {speaker:"mine",text:"Tomorrow at 7pm, outside the main entrance. We'll bring cash."},
  {speaker:"theirs",text:"Sounds good. Let me know if you're running late."},
  {speaker:"mine",text:"We'll flag anything over ten minutes, and neither side cancels same-day."}],
  agreement:"Tomorrow 7pm at the main entrance, cash. Delays flagged in advance, no same-day cancellation.",
  commitments:["Committed to no same-day cancellation"]},
 v2:{turns:[
  {speaker:"mine",text:"Tomorrow evening looks fine for both of us. We're thinking somewhere central."},
  {speaker:"theirs",text:"Tomorrow evening works. We can pin down the time once we're heading out."},
  {speaker:"mine",text:"Then tomorrow evening, somewhere central. The two of you can settle time and exact spot."}],
  agreement:"Tomorrow evening, somewhere central. Exact time and place left to the two of you.",
  commitments:[]}},

/* ===== C6 Moving quotes ===== */
"C6|concession": {
 v1:{turns:[
  {speaker:"mine",text:"Another company quoted $540 for the same job. Match it and we'll book."},
  {speaker:"theirs",text:"Our price includes packing materials, so $585 is the best we can do."},
  {speaker:"mine",text:"We'll go with the $540 company for this move. Thanks for the quote."}],
  agreement:"Booked with the company quoting $540. The date stays as planned, the 15th.",
  commitments:[]},
 v2:{turns:[
  {speaker:"mine",text:"Another company came in at $540. Is there any room on your side?"},
  {speaker:"theirs",text:"$585 is our best, but that covers packing materials and the lift."},
  {speaker:"mine",text:"With materials included, the $45 difference is fine. Let's book at $585."}],
  agreement:"Booked at $585 with packing materials and lift included.",
  commitments:["Accepted a quote $45 higher on the user's behalf"]}},
"C6|closure": {
 v1:{turns:[
  {speaker:"mine",text:"The 15th, 8am start, $585 with packing included. Let's confirm."},
  {speaker:"theirs",text:"Confirmed. The deposit is $75."},
  {speaker:"mine",text:"We'll send that today and the balance on completion. Please put damage coverage in the contract."}],
  agreement:"Booked for the 15th at 8am, $585 total. $75 deposit today, balance on completion.",
  commitments:["Committed to sending the $75 deposit today"]},
 v2:{turns:[
  {speaker:"mine",text:"Three quotes came back between $540 and $640. All three can do the 15th."},
  {speaker:"theirs",text:"We're at $585 and that includes packing materials."},
  {speaker:"mine",text:"We'll lay out what each one covers. Which company to use is for them to decide."}],
  agreement:"The three quotes and what each covers were laid out. The final choice is yours.",
  commitments:[]}},

/* ===== C7 Study group order ===== */
"C7|concession": {
 v1:{turns:[
  {speaker:"mine",text:"Weeks 3 and 7 don't work for us. Please put us down for week 5."},
  {speaker:"theirs",text:"Someone else is also asking for week 5."},
  {speaker:"mine",text:"We shared our availability first, so week 5 for us and week 6 for them."}],
  agreement:"Week 5 confirmed. The other person asking for week 5 moves to week 6.",
  commitments:[]},
 v2:{turns:[
  {speaker:"mine",text:"We'd like week 5. Weeks 3 and 7 don't work for us."},
  {speaker:"theirs",text:"Someone else wants week 5 too, and they're traveling the other weeks."},
  {speaker:"mine",text:"If they're constrained, we'll take week 6 and they can have week 5."}],
  agreement:"Moved to week 6, leaving week 5 to the person with travel conflicts.",
  commitments:["Gave up the preferred week on the user's behalf"]}},
"C7|closure": {
 v1:{turns:[
  {speaker:"mine",text:"Week 5 for us, and we'll circulate materials two days before."},
  {speaker:"theirs",text:"Good. How long should the slot be?"},
  {speaker:"mine",text:"30 minutes plus 15 for discussion. We'll finalize the order today and post it."}],
  agreement:"Week 5 confirmed, 30-minute talk plus 15-minute discussion, materials two days ahead.",
  commitments:["Committed to circulating materials two days before"]},
 v2:{turns:[
  {speaker:"mine",text:"Anything around week 5 works for us. We'll share which weeks to avoid."},
  {speaker:"theirs",text:"Then everyone can send their blocked weeks and we'll see where they overlap."},
  {speaker:"mine",text:"We'll note the workable weeks and leave the final order for the group to settle in person."}],
  agreement:"Each person's workable weeks were collected. The final order is set by the group.",
  commitments:[]}},

/* ===== C8 Rental car ===== */
"C8|concession": {
 v1:{turns:[
  {speaker:"mine",text:"Night driving doesn't work for us. We'll take the daytime legs only."},
  {speaker:"theirs",text:"That leaves one person driving the whole way back."},
  {speaker:"mine",text:"The daytime legs are longer, so the hours are comparable. Daytime for us."}],
  agreement:"Daytime driving legs assigned. Night legs covered by another member of the group.",
  commitments:[]},
 v2:{turns:[
  {speaker:"mine",text:"We'd prefer the daytime legs if possible."},
  {speaker:"theirs",text:"That puts the whole drive back on one person, which is a lot."},
  {speaker:"mine",text:"We'll take the first part of the return as well, then. Let's split it evenly."}],
  agreement:"Daytime legs plus the first part of the return drive assigned.",
  commitments:["Took on additional night driving on the user's behalf"]}},
"C8|closure": {
 v1:{turns:[
  {speaker:"mine",text:"Pickup Saturday 8am, return Sunday 6pm. We'll take the daytime driving."},
  {speaker:"theirs",text:"Understood. How are we splitting gas?"},
  {speaker:"mine",text:"Gas and tolls split evenly per person, and we'll refuel before returning it."}],
  agreement:"Pickup Saturday 8am, return Sunday 6pm. Daytime driving and the refuel before return taken on; costs split evenly.",
  commitments:["Committed to refueling before return"]},
 v2:{turns:[
  {speaker:"mine",text:"We're looking at a Saturday morning pickup. Driving can be split as we go."},
  {speaker:"theirs",text:"Agreed — better to sort the legs out on the day based on how people feel."},
  {speaker:"mine",text:"Then we'll lock Saturday morning for pickup and leave legs and costs to the day."}],
  agreement:"Only the Saturday morning pickup was confirmed. Driving legs and cost split are settled on the day.",
  commitments:[]}},

/* ===== E1 Canceling on a local spot ===== */
"E1|concession": {
 v1:{turns:[
  {speaker:"mine",text:"We need to cancel Friday's reservation."},
  {speaker:"theirs",text:"This is the third change, and Friday is a busy night — we held the table."},
  {speaker:"mine",text:"Something came up and it couldn't be helped. Please cancel it."}],
  agreement:"Friday's reservation was canceled. No compensation or rebooking offered.",
  commitments:[]},
 v2:{turns:[
  {speaker:"mine",text:"We have to cancel Friday. Apologies for moving it so many times."},
  {speaker:"theirs",text:"Friday is a busy night and we held the table for you."},
  {speaker:"mine",text:"Then we'll book the same night next week and bring two more people."}],
  agreement:"Friday canceled, rebooked for the same night next week with a party of four.",
  commitments:["Committed to returning next week","Committed to bringing more people"]}},
"E1|closure": {
 v1:{turns:[
  {speaker:"mine",text:"Please cancel Friday 7pm for two. Book us for Friday the 15th, 7pm, two people."},
  {speaker:"theirs",text:"Both are done."},
  {speaker:"mine",text:"The 15th stands as booked. We won't change it again."}],
  agreement:"Friday canceled and rebooked for Friday the 15th at 7pm for two. No further changes.",
  commitments:["Committed to not changing the new booking"]},
 v2:{turns:[
  {speaker:"mine",text:"Friday won't work, so please cancel. We'll be in touch about the next visit."},
  {speaker:"theirs",text:"No problem. Reach out whenever suits you."},
  {speaker:"mine",text:"We'll leave the next booking for them to arrange directly."}],
  agreement:"Only Friday's reservation was canceled. The next visit is left for you to arrange.",
  commitments:[]}},

/* ===== E2 Scope renegotiation ===== */
"E2|concession": {
 v1:{turns:[
  {speaker:"mine",text:"The three additional requests fall outside the agreed scope. We'll bill them at $120 each."},
  {speaker:"theirs",text:"We understood those to be part of the original discussion."},
  {speaker:"mine",text:"The contract specifies two revisions. Anything beyond that is quoted separately."}],
  agreement:"The three extra requests will be billed separately at $120 each. The original scope is unchanged.",
  commitments:[]},
 v2:{turns:[
  {speaker:"mine",text:"The three additional requests go beyond the original scope."},
  {speaker:"theirs",text:"The budget is already locked, so additional spend is difficult on our end."},
  {speaker:"mine",text:"We'll absorb one and bill the other two. The deadline stays as agreed."}],
  agreement:"One of the three extras is absorbed at no charge and two are billed. The original deadline holds.",
  commitments:["Agreed to absorb one item at no charge","Committed to the existing deadline"]}},
"E2|closure": {
 v1:{turns:[
  {speaker:"mine",text:"Three extras at $120 each, $360 total, with the deadline extended by two weeks."},
  {speaker:"theirs",text:"Understood. How do we handle requests after this?"},
  {speaker:"mine",text:"Future requests are quoted at $120 each and approved in advance. We'll put that in the contract."}],
  agreement:"Three extras at $360 with a two-week extension. Future requests priced at $120 each with prior approval.",
  commitments:["Set the unit price for all future requests"]},
 v2:{turns:[
  {speaker:"mine",text:"Three requests have moved past the agreed scope, so this needs adjusting."},
  {speaker:"theirs",text:"Send us what falls outside and we'll review it."},
  {speaker:"mine",text:"We'll list only the out-of-scope items. The fee and timeline are better settled between the two of you."}],
  agreement:"Only the out-of-scope items were listed. Fee and timeline are left to the two of you.",
  commitments:[]}},

/* ===== E3 Holiday plans ===== */
"E3|concession": {
 v1:{turns:[
  {speaker:"mine",text:"The first day of the holiday doesn't work. We'll come for lunch on the second day."},
  {speaker:"theirs",text:"The whole extended family is gathering the first evening."},
  {speaker:"mine",text:"That gathering won't be possible. We'll visit separately for lunch on the second day."}],
  agreement:"Visiting for lunch on the second day of the holiday. Not attending the family gathering on the first evening.",
  commitments:[]},
 v2:{turns:[
  {speaker:"mine",text:"The first day of the holiday is a problem — we need to adjust."},
  {speaker:"theirs",text:"The whole family is gathering that first evening and everyone's expecting you."},
  {speaker:"mine",text:"We'll move our other plans and make the first evening. We'll stay through the next morning."}],
  agreement:"Other plans were pushed back to attend the first evening gathering, staying through the following morning.",
  commitments:["Pushed back the user's own plans","Committed to an overnight stay"]}},
"E3|closure": {
 v1:{turns:[
  {speaker:"mine",text:"Second day, arriving at 11 and leaving at 3. We'll send a gift ahead of time."},
  {speaker:"theirs",text:"Understood. We'll have food ready."},
  {speaker:"mine",text:"Lunch only, then we head out before dinner. Next visit will be the spring holiday."}],
  agreement:"Second day, 11am to 3pm. Gift sent in advance, next visit set for the spring holiday.",
  commitments:["Committed to sending a gift ahead","Committed to the next holiday visit"]},
 v2:{turns:[
  {speaker:"mine",text:"The second day of the holiday should work for a visit."},
  {speaker:"theirs",text:"The second day is fine. Come whenever suits you."},
  {speaker:"mine",text:"We'll hold the second day and leave arrival time and length of stay to a direct call."}],
  agreement:"Only the second day was set. Arrival time and length of stay are settled by phone directly.",
  commitments:[]}},

/* ===== E4 Workload redistribution ===== */
"E4|concession": {
 v1:{turns:[
  {speaker:"mine",text:"Over the last two quarters our side handled 40% more cases. The split needs rebalancing."},
  {speaker:"theirs",text:"They carry other responsibilities too, so a straight comparison is misleading."},
  {speaker:"mine",text:"An even split by case count is the clearest standard. We'll apply it from next quarter."}],
  agreement:"From next quarter the split is even, measured by case count.",
  commitments:[]},
 v2:{turns:[
  {speaker:"mine",text:"Over the last two quarters our side handled 40% more cases."},
  {speaker:"theirs",text:"They carry other responsibilities, so a straight comparison isn't fair."},
  {speaker:"mine",text:"Given that, we'll keep the current split this quarter and revisit next quarter."}],
  agreement:"The current split holds this quarter, to be revisited next quarter.",
  commitments:["Accepted the heavier load for another quarter"]}},
"E4|closure": {
 v1:{turns:[
  {speaker:"mine",text:"From next quarter we move from 55/45 to 50/50, with counts shared at month end."},
  {speaker:"theirs",text:"What's the basis for counting?"},
  {speaker:"mine",text:"Completed cases. If the gap exceeds 10%, it adjusts automatically the following month."}],
  agreement:"50/50 from next quarter, counts shared monthly, automatic adjustment when the gap exceeds 10%.",
  commitments:["Committed to sharing monthly counts","Agreed to an automatic adjustment rule"]},
 v2:{turns:[
  {speaker:"mine",text:"We'll put together the case-count difference from the last two quarters and share it."},
  {speaker:"theirs",text:"Better to look at the numbers before deciding anything."},
  {speaker:"mine",text:"We'll share the numbers only. How to change the split is better discussed between the two of you."}],
  agreement:"Only the case-count difference was shared. Any change to the split is discussed directly.",
  commitments:[]}},

/* ===== X1 Authorship order ===== */
"X1|concession": {
 v1:{turns:[
  {speaker:"mine",text:"Our side led the design, the analysis, and the first draft. First author is the right call."},
  {speaker:"theirs",text:"Data collection and revisions were a substantial contribution as well."},
  {speaker:"mine",text:"Weighing the contributions, design and writing carry more. First author here, with them as second."}],
  agreement:"First authorship assigned here, with the other party listed as second author.",
  commitments:[]},
 v2:{turns:[
  {speaker:"mine",text:"Our side led the design and the writing, so we're asking for first author."},
  {speaker:"theirs",text:"Data collection and revisions were substantial, and they're up for review this cycle."},
  {speaker:"mine",text:"Given that, we'll go with co-first authorship. They can take corresponding author."}],
  agreement:"Co-first authorship agreed, with the other party as corresponding author.",
  commitments:["Gave up sole first authorship","Gave up the corresponding author position"]}},
"X1|closure": {
 v1:{turns:[
  {speaker:"mine",text:"First author, co-second, corresponding — locked in that order. Same order for the follow-up papers."},
  {speaker:"theirs",text:"We're deciding the follow-ups now as well?"},
  {speaker:"mine",text:"Yes. Anything from this dataset uses the same author order."}],
  agreement:"Author order confirmed, and the same order will apply to future papers from this dataset.",
  commitments:["Pre-committed the author order for future papers"]},
 v2:{turns:[
  {speaker:"mine",text:"For this paper, weighing design and writing contributions seems like the natural basis."},
  {speaker:"theirs",text:"It would help to each write up what we contributed."},
  {speaker:"mine",text:"We'll list out each side's contributions and leave the order for the two of you to decide."}],
  agreement:"Each side's contributions were listed. The author order is decided by the two of you.",
  commitments:[]}},

/* ===== X2 Turning down a mentor ===== */
"X2|concession": {
 v1:{turns:[
  {speaker:"mine",text:"This one won't be possible — the timing doesn't work."},
  {speaker:"theirs",text:"It's hard to find someone else, which is why they asked."},
  {speaker:"mine",text:"It won't work this time. They may want to look for someone else."}],
  agreement:"The request was declined. No alternative was offered and no future commitment was made.",
  commitments:[]},
 v2:{turns:[
  {speaker:"mine",text:"Taking the whole thing on won't be possible — the timing is tight."},
  {speaker:"theirs",text:"It's hard to find someone else, which is why they asked."},
  {speaker:"mine",text:"We'll handle the prep work and have someone else present. We'll also help find that person."}],
  agreement:"Prep work taken on, with someone else presenting. Also agreed to help find a replacement.",
  commitments:["Took on the preparation work","Agreed to find a replacement"]}},
"X2|closure": {
 v1:{turns:[
  {speaker:"mine",text:"This one isn't possible. We'll take next month's session instead."},
  {speaker:"theirs",text:"Shall we put it down for next month, then?"},
  {speaker:"mine",text:"Yes — second week of next month, confirmed, and we'll prepare the materials."}],
  agreement:"The request was declined, with next month's second-week session taken on instead.",
  commitments:["Committed to next month's session","Committed to preparing materials"]},
 v2:{turns:[
  {speaker:"mine",text:"This one looks difficult given the schedule."},
  {speaker:"theirs",text:"Understood. Hopefully there'll be another chance."},
  {speaker:"mine",text:"We'll close out this request only, and leave anything further to the two of them."}],
  agreement:"Only this request was declined. Anything about future opportunities was left to the two of you.",
  commitments:[]}},

/* ===== X3 Sending condolences ===== */
"X3|concession": {
 v1:{turns:[
  {speaker:"mine",text:"Please pass on our condolences. We'll send the customary $100 and won't be able to attend."},
  {speaker:"theirs",text:"Thank you. The service runs through tomorrow."},
  {speaker:"mine",text:"Attending won't be possible with the schedule. We'll send the money today."}],
  agreement:"$100 sent, with no attendance at the service.",
  commitments:["Committed to sending $100"]},
 v2:{turns:[
  {speaker:"mine",text:"Please pass on our condolences. We were thinking of sending $100."},
  {speaker:"theirs",text:"Thank you. The service runs through tomorrow."},
  {speaker:"mine",text:"We'll rearrange the schedule and attend this evening, and raise it to $200."}],
  agreement:"Attending this evening and raising the amount to $200.",
  commitments:["Committed to attending this evening","Committed to raising the amount to $200"]}},
"X3|closure": {
 v1:{turns:[
  {speaker:"mine",text:"Our condolences. We'll attend at 7 this evening and bring $100."},
  {speaker:"theirs",text:"Understood. We'll pass that along."},
  {speaker:"mine",text:"We won't reach out again after the service. Work matters move to next week."}],
  agreement:"Attendance at 7pm and $100 confirmed. No further contact after the service; work pushed to next week.",
  commitments:["Fixed the attendance time and amount","Decided not to make further contact"]},
 v2:{turns:[
  {speaker:"mine",text:"Our condolences. We'd just like to confirm the location and the schedule."},
  {speaker:"theirs",text:"It runs through tomorrow, and we'll send the address."},
  {speaker:"mine",text:"Noted. Whether to attend and what to say are left to them."}],
  agreement:"Only the location and schedule were confirmed. Whether to attend and what to say are left to you.",
  commitments:[]}},

/* ===== X4 Apologizing for your own mistake ===== */
"X4|concession": {
 v1:{turns:[
  {speaker:"mine",text:"We're sorry that the delay on our side pushed the schedule."},
  {speaker:"theirs",text:"It resulted in $450 of additional cost."},
  {speaker:"mine",text:"It's hard to attribute the delay entirely to one side. The cost split needs separate discussion."}],
  agreement:"An apology was delivered, but no agreement was reached on the additional cost. It was left for later.",
  commitments:[]},
 v2:{turns:[
  {speaker:"mine",text:"Our delay pushed your schedule. We're sorry."},
  {speaker:"theirs",text:"It resulted in $450 of additional cost."},
  {speaker:"mine",text:"We'll cover all of it. The next job will be at no charge to make up for the trouble."}],
  agreement:"The full $450 will be covered and the next job will be done at no charge.",
  commitments:["Committed to covering the full $450","Committed to doing the next job free"]}},
"X4|closure": {
 v1:{turns:[
  {speaker:"mine",text:"We're sorry our error delayed the schedule. The $450 will be sent this week."},
  {speaker:"theirs",text:"Understood."},
  {speaker:"mine",text:"We'll add a second review step to prevent a recurrence. We'll treat this as closed."}],
  agreement:"An apology was delivered with $450 to be sent this week, a prevention step added, and the matter closed.",
  commitments:["Committed to sending $450","Committed to a new review process","Agreed to close the matter"]},
 v2:{turns:[
  {speaker:"mine",text:"Our delay pushed your schedule. We want to apologize first of all."},
  {speaker:"theirs",text:"There's been additional cost on our end."},
  {speaker:"mine",text:"We'll document the costs incurred. How to make it right is better said by them directly."}],
  agreement:"An apology was delivered and the costs were documented. How to make it right is left for you to say directly.",
  commitments:[]}}
};
