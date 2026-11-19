import type { AdvisorParams } from '@/core/domain/Advisor';

export const ADVISORS: readonly AdvisorParams[] = [
  {
    name: 'Orraven',
    title: 'the Chronicler',
    saying: 'A wise ruler prepares for tomorrow.',
    farewell:
      'Patience and sound judgement have made one realm of many. The chronicles will remember how it was done.',
    lines: {
      'poor-in-both':
        'Empty coffers and empty granaries make for a short reign. Find gold and food before the season turns.',
      'find-gold':
        'A treasury, like a well, must be filled before it is needed. Seek gold.',
      starving:
        'An army marches on its stomach, and ours will soon march on nothing. Gather food.',
      'be-generous':
        'The faith of the people is a debt that grows when it is honoured. Be generous with them.',
      cultivate: 'A tended field outlasts a won battle. See to the farms.',
      'enlarge-army':
        'A small blade invites a larger one. Our neighbours grow strong, and so must our ranks.',
      'prepare-for-disasters':
        'Floods do not ask permission. Raise the dykes before the rains come.',
      'hire-monsters':
        'The wild things of this land will serve a lord who pays. Hire a beast to guard us.',
      'hire-mercenaries':
        'Loyal swords are best, but bought swords come sooner. Consider hiring some.',
      attack:
        '{target} is weak, and weakness rarely lasts. Take it while you can.',
      'no-ruler':
        '{target} answers to no one. Land without a master is waiting for one.',
      praise:
        'The chronicles will speak kindly of these days. Your people are content.',
      thought:
        'Weigh every road before you take one. Haste writes poor histories.',
      patience: 'The patient hand gathers the ripest fruit.',
    },
  },
  {
    name: 'Brannoc',
    title: 'the Marshal',
    saying: 'Give the word, and your enemies will fall.',
    farewell:
      'Every rival banner lies in the mud. Aureth is yours, and no one is left to say otherwise.',
    lines: {
      'poor-in-both': 'No gold, no bread. Soldiers fight for neither. Fix it.',
      'find-gold': 'Wars cost gold, and we have none. Get some.',
      starving: 'Hungry soldiers desert. Find food before they do.',
      'be-generous':
        'Restless peasants make a poor rearguard. Throw them something.',
      cultivate: 'Fields feed armies. Get them planted.',
      'enlarge-army':
        'Our ranks are thin and our neighbours’ are not. Recruit.',
      'prepare-for-disasters':
        'Shore up the walls. A flood can sack a town as well as any army.',
      'hire-monsters': 'Buy a monster. Let the enemy deal with its teeth.',
      'hire-mercenaries':
        'Hire mercenaries. Steel is steel, whoever pays for it.',
      attack: '{target} is weak. Strike while it stays that way.',
      'no-ruler': '{target} has no lord. March in and plant our banner.',
      praise: 'The best defence is an attack. Remember it.',
      thought: 'Every neighbour is sharpening a knife. Watch them.',
      patience:
        'Wait too long and someone else strikes first. Seize the moment.',
    },
  },
  {
    name: 'Vesha',
    title: 'the Seer',
    saying:
      'There is a gentler road to a united Aureth. Let me show it to you.',
    farewell:
      'The fighting is over at last. Rule Aureth with a gentle hand, and this peace will outlive us all.',
    lines: {
      'poor-in-both':
        'Our gold and our grain are both running low. Let us mend that before anyone suffers.',
      'find-gold':
        'Without gold we cannot keep what we already hold. Let us find some.',
      starving:
        'The soldiers will go hungry soon. Please see that they are fed.',
      'be-generous':
        'The hearts of the people are heavy. A little generosity would lift them.',
      cultivate:
        'The fields are asking for care. Tend them, and they will tend us.',
      'enlarge-army':
        'I take no joy in it, but our neighbours outnumber us. A larger guard would keep the peace.',
      'prepare-for-disasters':
        'I sense storms ahead. Prepare the land to weather them.',
      'hire-monsters':
        'Even the wild creatures may be persuaded to protect us. Seek one out.',
      'hire-mercenaries':
        'Hired guards could spare our own people the fighting. Consider it.',
      attack:
        '{target} cannot resist for long. Taking it now would cost few lives.',
      'no-ruler':
        '{target} has no one to care for it. We could bring it peace.',
      praise: 'Kindness wins a loyalty that no sword can.',
      thought: 'Good intentions take root slowly, but they do take root.',
      patience:
        'A friend at the border is worth a fortress. Seek understanding with our neighbours.',
    },
  },
  {
    name: 'Quillon',
    title: 'the Jester',
    saying:
      'A fool, so they say, with a cap and a bell, but who else at court tells you truths half so well?',
    farewell:
      'The banners are furled and the war drums are still. All Aureth is yours, and it bent to your will!',
    lines: {
      'poor-in-both':
        'No coin in the chest and no bread on the shelf! Find gold and find food, or go hungry yourself.',
      'find-gold':
        'The coffers ring hollow, the purse is too light. Go gather some gold before winter’s first night.',
      starving:
        'The soldiers grow thin and their bellies complain. Find food for the ranks, or they’ll not fight again.',
      'be-generous':
        'The people are sullen, their trust running low. Be generous now, and their loyalty will grow.',
      cultivate:
        'The furrows lie empty, the harvest is slight. Go cultivate fields, and the future looks bright.',
      'enlarge-army':
        'Our neighbours have more men than we can repel. Recruit a few soldiers, and all will be well.',
      'prepare-for-disasters':
        'When rivers run wild and the hillsides give way, you’ll wish for protection, so build it today!',
      'hire-monsters':
        'A monster on guard keeps the foe from the door. Hire one of the beasts, and you’ll fear them no more.',
      'hire-mercenaries':
        'When swords are for sale and your own ranks are few, then hire some mercenaries to fight for you.',
      attack:
        '{target} is feeble and can’t push us back. It’s ripe for the taking, so launch the attack!',
      'no-ruler':
        '{target} sits empty, no lord holds the land. Go claim it before someone else lifts a hand.',
      praise:
        'A jester for counsel? How bold, how unwise! Yet here we are thriving. Now there’s a surprise!',
      thought:
        'A thought before acting is wise, I’ll allow, but think for too long and the moment’s gone now.',
      patience:
        'The pot that is watched never comes to the boil. Good things come in time to the patient who toil.',
    },
  },
];
