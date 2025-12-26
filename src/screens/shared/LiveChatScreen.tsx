import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
  Alert,
  Modal,
  ActionSheetIOS,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import supportService, { SupportTicket, SupportMessage } from '../../services/supportService';
import { FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAppSelector } from '../../store';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  agentName?: string;
  agentAvatar?: string;
  type?: 'text' | 'image' | 'file' | 'location' | 'system';
  imageUrl?: string;
  attachments?: {
    url: string;
    type: string;
    name: string;
    size?: number;
  }[];
}

type LiveChatRouteParams = {
  LiveChat: {
    subject?: string;
    category?: string;
    orderId?: string;
    initialMessage?: string;
  };
};

interface QuickReply {
  id: string;
  text: string;
  category?: string;
}

const QUICK_REPLIES: QuickReply[] = [
  { id: '1', text: 'Track my order', category: 'order' },
  { id: '2', text: 'Request refund', category: 'refund' },
  { id: '3', text: 'Payment issue', category: 'payment' },
  { id: '4', text: 'Delivery problem', category: 'delivery' },
];

const EMOJI_LIST: Record<string, string[]> = {
  'Smileys & Emotion': [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊',
    '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛',
    '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑',
    '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷',
    '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳',
    '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳',
    '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
    '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️',
    '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻',
    '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊',
  ],
  'Gestures & People': [
    '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘',
    '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
    '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾',
    '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀',
    '👁️', '👅', '👄', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👩',
    '🧓', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏', '🙇', '🤦',
    '🤷', '👮', '🕵️', '💂', '🥷', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵',
    '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜',
    '🧝', '🧞', '🧟', '💆', '💇', '🚶', '🧍', '🧎', '🏃', '💃', '🕺', '🕴️',
    '👯', '🧖', '🧗', '🤸', '🏌️', '🏇', '⛷️', '🏂', '🏋️', '🤼', '🤽', '🤾',
    '🤺', '⛹️', '🏊', '🚣', '🧘', '🛀', '🛌', '👭', '👫', '👬', '💏', '💑',
    '👪', '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧',
  ],
  'Hearts & Love': [
    '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔',
    '❤️‍🔥', '❤️‍🩹', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💯',
    '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭',
    '💤', '🫂', '👥', '👤', '🫂',
  ],
  'Animals & Nature': [
    '🐵', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊', '🦝',
    '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌',
    '🦬', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐',
    '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹',
    '🐰', '🐇', '🐿️', '🦫', '🦔', '🦇', '🐻', '🐻‍❄️', '🐨', '🐼', '🦥', '🦦',
    '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧',
    '🕊️', '🦅', '🦆', '🦢', '🦉', '🦤', '🪶', '🦩', '🦚', '🦜', '🐸', '🐊',
    '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🦭', '🐟',
    '🐠', '🐡', '🦈', '🐙', '🐚', '🐌', '🦋', '🐛', '🐜', '🐝', '🪲', '🐞',
    '🦗', '🪳', '🕷️', '🕸️', '🦂', '🦟', '🪰', '🪱', '🦠', '💐', '🌸', '💮',
    '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴',
    '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍇', '🍈', '🍉', '🍊',
    '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝',
    '🍅', '🫒', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬',
    '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🫓', '🥨', '🥯',
    '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪',
    '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🫕', '🥣', '🥗',
    '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠',
    '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🦐',
    '🦑', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫',
    '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🫖', '🍵', '🍶', '🍾', '🍷',
    '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧋', '🧃', '🧉', '🧊', '🥢',
    '🍽️', '🍴', '🥄', '🔪', '🏺',
  ],
  'Activities & Sports': [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓',
    '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿',
    '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂',
    '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽',
    '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️',
    '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹',
    '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳',
    '🎮', '🕹️', '🎰', '🧩',
  ],
  'Travel & Places': [
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚',
    '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔',
    '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅',
    '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️',
    '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '🪝',
    '⛽', '🚧', '🚦', '🚥', '🚏', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️',
    '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻',
    '🏕️', '⛺', '🛖', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣',
    '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🕍',
    '🛕', '🕋', '⛩️', '🛤️', '🛣️', '🗾', '🎑', '🏞️', '🌅', '🌄', '🌠', '🎇',
    '🎆', '🌇', '🌆', '🏙️', '🌃', '🌌', '🌉', '🌁',
  ],
  'Objects': [
    '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽',
    '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️',
    '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️',
    '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸',
    '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛',
    '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲',
    '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️',
    '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊',
    '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🪠', '🧺', '🧻', '🚽',
    '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🛎️', '🔑',
    '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🪆', '🖼️', '🪞', '🪟', '🛍️',
    '🛒', '🎁', '🎈', '🎏', '🎀', '🪄', '🪅', '🎊', '🎉', '🎎', '🏮', '🎐',
    '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '🪧', '📪',
    '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈',
    '📉', '🗒️', '🗓️', '📆', '📅', '🗑️', '📇', '🗃️', '🗳️', '🗄️', '📋', '📁',
    '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚',
    '📖', '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '🧮', '📌', '📍', '✂️',
    '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '✏️', '🔍', '🔎', '🔏', '🔐', '🔒',
    '🔓',
  ],
  'Symbols': [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
    '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
    '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌',
    '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️',
    '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️',
    '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌',
    '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱',
    '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️',
    '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎',
    '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🈳', '🈂️',
    '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧️', '🚻', '🚮', '🎦', '📶',
    '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓',
    '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢',
    '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪',
    '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️',
    '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃',
    '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾️', '💲', '💱', '™️', '©️', '®️',
    '👁️‍🗨️', '🔚', '🔙', '🔛', '🔝', '🔜', '〰️', '➰', '➿', '✔️', '☑️', '🔘',
    '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸',
    '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥',
    '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉', '🔊',
    '🔔', '🔕', '📣', '📢', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏',
    '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙',
    '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥',
    '🕦', '🕧',
  ],
  'Flags': [
    '🏳️', '🏴', '🏴‍☠️', '🏁', '🚩', '🎌', '🏳️‍🌈', '🏳️‍⚧️', '🇺🇳', '🇦🇫', '🇦🇱', '🇩🇿',
    '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶', '🇦🇬', '🇦🇷', '🇦🇲', '🇦🇼', '🇦🇺', '🇦🇹', '🇦🇿',
    '🇧🇸', '🇧🇭', '🇧🇩', '🇧🇧', '🇧🇾', '🇧🇪', '🇧🇿', '🇧🇯', '🇧🇲', '🇧🇹', '🇧🇴', '🇧🇦',
    '🇧🇼', '🇧🇷', '🇮🇴', '🇻🇬', '🇧🇳', '🇧🇬', '🇧🇫', '🇧🇮', '🇰🇭', '🇨🇲', '🇨🇦', '🇮🇨',
    '🇨🇻', '🇧🇶', '🇰🇾', '🇨🇫', '🇹🇩', '🇨🇱', '🇨🇳', '🇨🇽', '🇨🇨', '🇨🇴', '🇰🇲', '🇨🇬',
    '🇨🇩', '🇨🇰', '🇨🇷', '🇨🇮', '🇭🇷', '🇨🇺', '🇨🇼', '🇨🇾', '🇨🇿', '🇩🇰', '🇩🇯', '🇩🇲',
    '🇩🇴', '🇪🇨', '🇪🇬', '🇸🇻', '🇬🇶', '🇪🇷', '🇪🇪', '🇸🇿', '🇪🇹', '🇪🇺', '🇫🇰', '🇫🇴',
    '🇫🇯', '🇫🇮', '🇫🇷', '🇬🇫', '🇵🇫', '🇹🇫', '🇬🇦', '🇬🇲', '🇬🇪', '🇩🇪', '🇬🇭', '🇬🇮',
    '🇬🇷', '🇬🇱', '🇬🇩', '🇬🇵', '🇬🇺', '🇬🇹', '🇬🇬', '🇬🇳', '🇬🇼', '🇬🇾', '🇭🇹', '🇭🇳',
    '🇭🇰', '🇭🇺', '🇮🇸', '🇮🇳', '🇮🇩', '🇮🇷', '🇮🇶', '🇮🇪', '🇮🇲', '🇮🇱', '🇮🇹', '🇯🇲',
    '🇯🇵', '🎌', '🇯🇪', '🇯🇴', '🇰🇿', '🇰🇪', '🇰🇮', '🇽🇰', '🇰🇼', '🇰🇬', '🇱🇦', '🇱🇻',
    '🇱🇧', '🇱🇸', '🇱🇷', '🇱🇾', '🇱🇮', '🇱🇹', '🇱🇺', '🇲🇴', '🇲🇬', '🇲🇼', '🇲🇾', '🇲🇻',
    '🇲🇱', '🇲🇹', '🇲🇭', '🇲🇶', '🇲🇷', '🇲🇺', '🇾🇹', '🇲🇽', '🇫🇲', '🇲🇩', '🇲🇨', '🇲🇳',
    '🇲🇪', '🇲🇸', '🇲🇦', '🇲🇿', '🇲🇲', '🇳🇦', '🇳🇷', '🇳🇵', '🇳🇱', '🇳🇨', '🇳🇿', '🇳🇮',
    '🇳🇪', '🇳🇬', '🇳🇺', '🇳🇫', '🇰🇵', '🇲🇰', '🇲🇵', '🇳🇴', '🇴🇲', '🇵🇰', '🇵🇼', '🇵🇸',
    '🇵🇦', '🇵🇬', '🇵🇾', '🇵🇪', '🇵🇭', '🇵🇳', '🇵🇱', '🇵🇹', '🇵🇷', '🇶🇦', '🇷🇪', '🇷🇴',
    '🇷🇺', '🇷🇼', '🇼🇸', '🇸🇲', '🇸🇹', '🇸🇦', '🇸🇳', '🇷🇸', '🇸🇨', '🇸🇱', '🇸🇬', '🇸🇽',
    '🇸🇰', '🇸🇮', '🇬🇸', '🇸🇧', '🇸🇴', '🇿🇦', '🇰🇷', '🇸🇸', '🇪🇸', '🇱🇰', '🇧🇱', '🇸🇭',
    '🇰🇳', '🇱🇨', '🇵🇲', '🇻🇨', '🇸🇩', '🇸🇷', '🇸🇪', '🇨🇭', '🇸🇾', '🇹🇼', '🇹🇯', '🇹🇿',
    '🇹🇭', '🇹🇱', '🇹🇬', '🇹🇰', '🇹🇴', '🇹🇹', '🇹🇳', '🇹🇷', '🇹🇲', '🇹🇨', '🇹🇻', '🇻🇮',
    '🇺🇬', '🇺🇦', '🇦🇪', '🇬🇧', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🏴󠁧󠁢󠁷󠁬󠁳󠁿', '🇺🇸', '🇺🇾', '🇺🇿', '🇻🇺', '🇻🇦',
    '🇻🇪', '🇻🇳', '🇼🇫', '🇪🇭', '🇾🇪', '🇿🇲', '🇿🇼',
  ],
};

const LiveChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<LiveChatRouteParams, 'LiveChat'>>();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const typingAnim = useRef(new Animated.Value(0)).current;
  const { colors, isDark } = useTheme();
  
  // Check if user is authenticated
  const { accessToken, user } = useAppSelector(state => state.auth);
  const isAuthenticated = !!accessToken && !!user;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const EMOJIS = ['😀', '😊', '😂', '🥰', '😍', '🤔', '👍', '👎', '❤️', '🔥', '✨', '🎉', '👋', '🙏', '💯', '😢', '😡', '🤝', '📦', '🚚'];

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: isDark ? colors.background : '#F9FAFB',
    },
    messageBubble: {
      backgroundColor: isDark ? colors.card : '#F3F4F6',
    },
    inputContainer: {
      backgroundColor: isDark ? colors.card : '#FFF',
      borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
    },
    inputWrapper: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
    },
    messageText: {
      color: colors.text,
    },
    timestamp: {
      color: colors.textSecondary,
    },
    quickReplyText: {
      color: isDark ? colors.text : '#374151',
    },
    quickReplyContainer: {
      backgroundColor: isDark ? colors.card : '#FFF',
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
    },
    modalContainer: {
      backgroundColor: isDark ? colors.card : '#FFF',
    },
    modalText: {
      color: isDark ? colors.text : '#1F2937',
    },
    modalSecondaryText: {
      color: colors.textSecondary,
    },
    menuItemText: {
      color: isDark ? colors.text : '#374151',
    },
  }), [colors, isDark]);

  // Transform SupportMessage to local Message format
  const transformMessage = useCallback((msg: SupportMessage): Message => {
    // For image messages, get the URL from attachments or content (if content is a URL)
    let imageUrl = msg.attachments?.[0]?.url;
    if (msg.type === 'image' && !imageUrl && msg.content?.startsWith('http')) {
      imageUrl = msg.content;
    }
    
    return {
      id: msg.id,
      text: msg.type === 'image' ? '📷 Photo' : msg.content,
      sender: msg.senderType,
      timestamp: new Date(msg.createdAt),
      status: msg.isRead ? 'read' : 'delivered',
      agentName: msg.sender?.name,
      agentAvatar: msg.sender?.avatar,
      type: msg.type,
      imageUrl,
      attachments: msg.attachments,
    };
  }, []);

  // Initialize chat session
  useEffect(() => {
    // Skip initialization if not authenticated - guest mode will show contact options
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    
    const initChat = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Try to get active chat first
        const activeChat = await supportService.getActiveChat();
        
        if (activeChat) {
          setTicket(activeChat.ticket);
          // Deduplicate messages by ID
          const uniqueMessages = activeChat.messages.reduce((acc: SupportMessage[], msg) => {
            if (!acc.some(m => m.id === msg.id)) {
              acc.push(msg);
            }
            return acc;
          }, []);
          setMessages(uniqueMessages.map(transformMessage));
        } else {
          // Start new chat
          const { subject, category, orderId, initialMessage } = route.params || {};
          const newChat = await supportService.startChat({
            subject: subject || 'Live Support Chat',
            category: category || 'other',
            orderId,
            initialMessage,
          });
          setTicket(newChat.ticket);
          // Deduplicate messages by ID
          const uniqueMessages = newChat.messages.reduce((acc: SupportMessage[], msg) => {
            if (!acc.some(m => m.id === msg.id)) {
              acc.push(msg);
            }
            return acc;
          }, []);
          setMessages(uniqueMessages.map(transformMessage));
        }
      } catch (err) {
        console.error('[LiveChat] Init error:', err);
        setError('Failed to connect to support. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initChat();

    return () => {
      // Cleanup on unmount
      if (ticket?.id) {
        supportService.unsubscribeFromMessages(ticket.id);
        supportService.unsubscribeFromTyping(ticket.id);
      }
      supportService.disconnect();
    };
  }, [isAuthenticated]);

  // Track message IDs that we've sent to avoid duplicates from socket broadcast
  const sentMessageIdsRef = useRef<Set<string>>(new Set());
  // Track pending temp message IDs that are waiting for API response
  const pendingTempIdsRef = useRef<Map<string, string>>(new Map()); // content -> tempId

  // Setup socket subscriptions when ticket is available
  useEffect(() => {
    if (!ticket?.id) return;

    // Subscribe to incoming messages
    const handleMessage = (message: SupportMessage) => {
      const newMessage = transformMessage(message);
      setMessages(prev => {
        // Check for duplicate by id
        if (prev.some(m => m.id === newMessage.id)) {
          console.log('[LiveChat] Skipping duplicate message by id:', newMessage.id);
          return prev;
        }
        // Check if we sent this message (it will come back via broadcast)
        if (sentMessageIdsRef.current.has(newMessage.id)) {
          console.log('[LiveChat] Skipping our own sent message:', newMessage.id);
          // Don't delete - keep it to prevent future duplicates in case of retries
          return prev;
        }
        // Check if this is a response to a pending message we sent
        // (socket arrived before API response)
        if (message.senderType === 'user') {
          const tempId = pendingTempIdsRef.current.get(message.content);
          if (tempId) {
            console.log('[LiveChat] Socket arrived before API response, replacing temp message');
            pendingTempIdsRef.current.delete(message.content);
            sentMessageIdsRef.current.add(newMessage.id);
            // Replace the temp message with the real one
            return prev.map(m => m.id === tempId ? newMessage : m);
          }
        }
        return [...prev, newMessage];
      });
      // Mark as read immediately if from agent
      if (message.senderType === 'agent' || message.senderType === 'system') {
        supportService.markAsRead(ticket.id, [message.id]);
      }
    };

    // Subscribe to typing indicators
    const handleTyping = (data: { isTyping: boolean; isAdmin: boolean }) => {
      if (data.isAdmin) {
        setIsAgentTyping(data.isTyping);
      }
    };

    supportService.subscribeToMessages(ticket.id, handleMessage);
    supportService.subscribeToTyping(ticket.id, handleTyping);

    return () => {
      supportService.unsubscribeFromMessages(ticket.id, handleMessage);
      supportService.unsubscribeFromTyping(ticket.id, handleTyping);
    };
  }, [ticket?.id, transformMessage]);

  const handleAttachmentPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library', 'Send Document', 'Share Location'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await handleTakePhoto();
          } else if (buttonIndex === 2) {
            await handleChoosePhoto();
          } else if (buttonIndex === 3) {
            handleSendDocument();
          } else if (buttonIndex === 4) {
            handleShareLocation();
          }
        }
      );
    } else {
      setShowAttachmentModal(true);
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        await sendImageMessage(result.assets[0]);
      }
    } else {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
    }
  };

  const handleChoosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        await sendImageMessage(result.assets[0]);
      }
    } else {
      Alert.alert('Permission Required', 'Gallery permission is needed to choose photos.');
    }
  };

  const handleSendDocument = () => {
    Alert.alert('Send Document', 'Document picker would open here.', [
      { text: 'OK' }
    ]);
  };

  const handleShareLocation = () => {
    Alert.alert(
      'Share Location',
      'Would you like to share your current location with the support agent?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share', onPress: () => sendMessage('📍 [Location shared]') }
      ]
    );
  };

  const handleEmojiPress = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleMenuPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'View Agent Profile', 'Clear Chat', 'End Chat', 'Report Issue'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleViewAgentProfile();
          } else if (buttonIndex === 2) {
            handleClearChat();
          } else if (buttonIndex === 3) {
            handleEndChat();
          } else if (buttonIndex === 4) {
            handleReportIssue();
          }
        }
      );
    } else {
      setShowMenuModal(true);
    }
  };

  const handleViewAgentProfile = () => {
    Alert.alert(
      'Support Agent',
      'Name: Sarah\nRole: Customer Support\nRating: 4.9 ⭐\n\nSarah has been helping Handwork customers for 2 years and specializes in order and delivery issues.',
      [{ text: 'Close' }]
    );
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => setMessages([])
        }
      ]
    );
  };

  const handleEndChat = () => {
    Alert.alert(
      'End Chat',
      'Are you sure you want to end this chat session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Chat', 
          style: 'destructive',
          onPress: async () => {
            if (ticket?.id) {
              // Show rating dialog
              Alert.alert(
                'Rate Your Experience',
                'How would you rate this support session?',
                [
                  { text: 'Skip', onPress: () => endChatSession() },
                  { text: '⭐', onPress: () => endChatSession(1) },
                  { text: '⭐⭐', onPress: () => endChatSession(2) },
                  { text: '⭐⭐⭐', onPress: () => endChatSession(3) },
                  { text: '⭐⭐⭐⭐', onPress: () => endChatSession(4) },
                  { text: '⭐⭐⭐⭐⭐', onPress: () => endChatSession(5) },
                ]
              );
            } else {
              navigation.goBack();
            }
          }
        }
      ]
    );
  };

  const endChatSession = async (rating?: number) => {
    try {
      if (ticket?.id) {
        await supportService.endChat(ticket.id, rating);
      }
      Alert.alert('Chat Ended', 'Thank you for contacting Handwork support!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error('[LiveChat] End chat error:', err);
      navigation.goBack();
    }
  };

  const submitReport = async (type: 'inappropriate_behavior' | 'technical_problem') => {
    try {
      await supportService.submitReport({
        type,
        ticketId: ticket?.id,
        description: `Report from live chat session${ticket?.ticketNumber ? ` (${ticket.ticketNumber})` : ''}`,
      });
      Alert.alert(
        'Report Submitted',
        type === 'inappropriate_behavior'
          ? 'Thank you for your report. We will review this conversation.'
          : 'Thank you. Our technical team will look into this.'
      );
    } catch (error) {
      console.error('[LiveChat] Submit report error:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const handleReportIssue = () => {
    Alert.alert(
      'Report Issue',
      'What would you like to report?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Inappropriate Behavior', onPress: () => submitReport('inappropriate_behavior') },
        { text: 'Technical Problem', onPress: () => submitReport('technical_problem') }
      ]
    );
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isAgentTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingAnim.setValue(0);
    }
  }, [isAgentTyping]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !ticket?.id || sendingMessage) return;

    const tempId = `temp-${Date.now()}`;
    const newMessage: Message = {
      id: tempId,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
    };

    // Track this as a pending message to handle race condition with socket
    pendingTempIdsRef.current.set(text.trim(), tempId);
    
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setSendingMessage(true);

    // Send typing indicator (stop typing)
    supportService.sendTypingIndicator(ticket.id, false);

    try {
      const sentMessage = await supportService.sendMessage(ticket.id, text.trim());
      
      // Track this message ID to ignore socket broadcast (if it hasn't arrived yet)
      sentMessageIdsRef.current.add(sentMessage.id);
      // Remove from pending
      pendingTempIdsRef.current.delete(text.trim());
      
      // Replace temp message with real message (if socket hasn't already replaced it)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? transformMessage(sentMessage) : msg
        )
      );
    } catch (error) {
      console.error('[LiveChat] Send message error:', error);
      // Mark message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: 'sending' } : msg
        )
      );
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Track temp IDs for image messages to prevent duplicates
  const imageMessageTempIdsRef = useRef<Set<string>>(new Set());

  // Send image message
  const sendImageMessage = async (imageAsset: ImagePicker.ImagePickerAsset) => {
    if (!ticket?.id || sendingMessage) return;

    const tempId = `temp-${Date.now()}`;
    
    // Track this temp ID to prevent duplicates
    imageMessageTempIdsRef.current.add(tempId);
    
    // Create optimistic image message with local URI
    const newMessage: Message = {
      id: tempId,
      text: '📷 Photo',
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
      type: 'image',
      imageUrl: imageAsset.uri,
    };

    setMessages((prev) => [...prev, newMessage]);
    setSendingMessage(true);

    let uploadedImageUrl: string | null = null;

    try {
      // Import upload service
      const { uploadService } = await import('../../services/uploadService');
      
      // Convert image to base64 if not already
      let base64Data = imageAsset.base64;
      if (!base64Data) {
        // Fetch and convert to base64
        const response = await fetch(imageAsset.uri);
        const blob = await response.blob();
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      // Upload image
      console.log('[LiveChat] Uploading image to support folder...');
      const uploadResult = await uploadService.uploadImage(
        `data:image/jpeg;base64,${base64Data}`,
        'support'
      );

      console.log('[LiveChat] Upload result:', uploadResult);

      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error || 'Failed to upload image');
      }

      uploadedImageUrl = uploadResult.data.url;
      console.log('[LiveChat] Image uploaded, URL:', uploadedImageUrl);

      // Track this URL in pendingTempIdsRef for socket deduplication
      pendingTempIdsRef.current.set(uploadedImageUrl, tempId);

      // Send message with image URL
      const sentMessage = await supportService.sendMessage(
        ticket.id,
        uploadedImageUrl,
        'image'
      );

      console.log('[LiveChat] Message sent:', sentMessage);
      console.log('[LiveChat] sentMessage.attachments:', sentMessage.attachments);

      // Track this message ID (don't delete on socket receive)
      sentMessageIdsRef.current.add(sentMessage.id);
      
      // Remove from pending
      if (uploadedImageUrl) {
        pendingTempIdsRef.current.delete(uploadedImageUrl);
      }
      imageMessageTempIdsRef.current.delete(tempId);

      // Update message with real data - also deduplicate
      setMessages((prev) => {
        // First check if socket already added this message
        const alreadyExists = prev.some(m => m.id === sentMessage.id && m.id !== tempId);
        if (alreadyExists) {
          // Socket already added it, just remove the temp message
          return prev.filter(m => m.id !== tempId);
        }
        // Update temp message with real data
        return prev.map((msg) =>
          msg.id === tempId
            ? {
                ...transformMessage(sentMessage),
                imageUrl: uploadedImageUrl || sentMessage.attachments?.[0]?.url,
              }
            : msg
        );
      });
    } catch (error) {
      console.error('[LiveChat] Send image error:', error);
      // Cleanup tracking
      if (uploadedImageUrl) {
        pendingTempIdsRef.current.delete(uploadedImageUrl);
      }
      imageMessageTempIdsRef.current.delete(tempId);
      // Mark message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
      Alert.alert('Error', 'Failed to send image. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle user typing indicator
  const handleTextChange = (text: string) => {
    setInputText(text);
    
    if (ticket?.id) {
      // Send typing indicator
      supportService.sendTypingIndicator(ticket.id, true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        supportService.sendTypingIndicator(ticket.id, false);
      }, 2000);
    }
  };

  const handleQuickReply = (reply: QuickReply) => {
    sendMessage(reply.text);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <Ionicons name="time-outline" size={14} color="#9CA3AF" />;
      case 'sent':
        return <Ionicons name="checkmark" size={14} color="#9CA3AF" />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={14} color="#9CA3AF" />;
      case 'read':
        return <Ionicons name="checkmark-done" size={14} color="#7C3AED" />;
      default:
        return null;
    }
  };

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.sender === 'user';
    const showAvatar = !isUser && (index === 0 || messages[index - 1].sender === 'user');
    const isImageMessage = item.type === 'image' && (item.imageUrl || item.attachments?.[0]?.url);
    const imageUrl = item.imageUrl || item.attachments?.[0]?.url;

    // Debug log for image messages
    if (item.type === 'image') {
      console.log('[LiveChat] Rendering image message:', {
        id: item.id,
        type: item.type,
        imageUrl: item.imageUrl,
        attachments: item.attachments,
        isImageMessage,
        finalImageUrl: imageUrl,
      });
    }

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.agentMessageContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {!isUser && showAvatar && (
          <View style={styles.avatarContainer}>
            {item.agentAvatar && item.agentAvatar.trim() !== '' ? (
              <Image
                source={{ uri: item.agentAvatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Ionicons name="person" size={16} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.onlineIndicator} />
          </View>
        )}
        {!isUser && !showAvatar && <View style={styles.avatarSpacer} />}
        
        <View style={[
          styles.messageBubble, 
          isUser ? styles.userBubble : [styles.agentBubble, dynamicStyles.messageBubble],
          isImageMessage && styles.imageBubble,
        ]}>
          {!isUser && showAvatar && (
            <Text style={[styles.agentName, { color: colors.textSecondary }]}>{item.agentName}</Text>
          )}
          
          {/* Image content */}
          {isImageMessage && imageUrl ? (
            <TouchableOpacity 
              onPress={() => {
                console.log('[LiveChat] Image pressed, opening preview:', imageUrl);
                setSelectedImage(imageUrl);
              }}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.messageImage}
                resizeMode="cover"
                onError={(e) => console.error('[LiveChat] Image load error:', imageUrl, e.nativeEvent.error)}
                onLoad={() => console.log('[LiveChat] Image loaded successfully:', imageUrl)}
              />
              {item.status === 'sending' && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="small" color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <Text style={[styles.messageText, isUser ? styles.userMessageText : dynamicStyles.messageText]}>
              {item.text}
            </Text>
          )}
          
          <View style={styles.messageFooter}>
            <Text style={[styles.timestamp, isUser ? styles.userTimestamp : dynamicStyles.timestamp]}>
              {formatTime(item.timestamp)}
            </Text>
            {isUser && (
              <View style={styles.statusIcon}>
                {getStatusIcon(item.status)}
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isAgentTyping) return null;

    return (
      <View style={[styles.messageContainer, styles.agentMessageContainer]}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
            style={styles.avatar}
          />
          <View style={styles.onlineIndicator} />
        </View>
        <View style={[styles.messageBubble, styles.agentBubble, styles.typingBubble, dynamicStyles.messageBubble]}>
          <View style={styles.typingDots}>
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                style={[
                  styles.typingDot,
                  { backgroundColor: colors.textSecondary },
                  {
                    opacity: typingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: i === 1 ? [0.4, 1] : [1, 0.4],
                    }),
                    transform: [
                      {
                        translateY: typingAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: i === 1 ? [0, -4] : [-4, 0],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Guest Contact UI - for unauthenticated users
  const handleContactEmail = () => {
    Linking.openURL('mailto:support@handwork.ng?subject=Support%20Request');
  };

  const handleContactPhone = () => {
    Linking.openURL('tel:+2348000000000');
  };

  const handleContactWhatsApp = () => {
    Linking.openURL('https://wa.me/2348000000000?text=Hello,%20I%20need%20help%20with%20Handwork');
  };

  // Render Guest Contact Form for unauthenticated users
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        {/* Header */}
        <LinearGradient
          colors={['#7C3AED', '#9333EA']}
          style={[styles.header, { paddingTop: insets.top }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
              <View style={styles.headerAvatarContainer}>
                <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
                  <Ionicons name="headset" size={24} color="#FFF" />
                </View>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Handwork Support</Text>
                <Text style={styles.headerSubtitle}>Contact Us</Text>
              </View>
            </View>
            
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        {/* Guest Contact Options */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}
        >
          <View style={[styles.guestWelcomeCard, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
            <View style={styles.guestIconContainer}>
              <Ionicons name="chatbubbles" size={48} color="#7C3AED" />
            </View>
            <Text style={[styles.guestTitle, { color: colors.text }]}>
              Need Help?
            </Text>
            <Text style={[styles.guestSubtitle, { color: colors.textSecondary }]}>
              You can reach our support team through any of the channels below. For faster assistance, please sign in to your account.
            </Text>
          </View>

          <Text style={[styles.guestSectionTitle, { color: colors.text }]}>
            Contact Options
          </Text>

          <TouchableOpacity 
            style={[styles.guestContactOption, { backgroundColor: isDark ? colors.card : '#FFF' }]}
            onPress={handleContactEmail}
          >
            <View style={[styles.guestContactIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="mail" size={24} color="#7C3AED" />
            </View>
            <View style={styles.guestContactInfo}>
              <Text style={[styles.guestContactTitle, { color: colors.text }]}>Email Us</Text>
              <Text style={[styles.guestContactSubtitle, { color: colors.textSecondary }]}>
                support@handwork.ng
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.guestContactOption, { backgroundColor: isDark ? colors.card : '#FFF' }]}
            onPress={handleContactPhone}
          >
            <View style={[styles.guestContactIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="call" size={24} color="#10B981" />
            </View>
            <View style={styles.guestContactInfo}>
              <Text style={[styles.guestContactTitle, { color: colors.text }]}>Call Us</Text>
              <Text style={[styles.guestContactSubtitle, { color: colors.textSecondary }]}>
                +234 800 000 0000
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.guestContactOption, { backgroundColor: isDark ? colors.card : '#FFF' }]}
            onPress={handleContactWhatsApp}
          >
            <View style={[styles.guestContactIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#22C55E" />
            </View>
            <View style={styles.guestContactInfo}>
              <Text style={[styles.guestContactTitle, { color: colors.text }]}>WhatsApp</Text>
              <Text style={[styles.guestContactSubtitle, { color: colors.textSecondary }]}>
                Chat with us instantly
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.guestSignInCard, { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.1)' : '#F5F3FF' }]}>
            <Ionicons name="person-circle" size={32} color="#7C3AED" />
            <View style={styles.guestSignInInfo}>
              <Text style={[styles.guestSignInTitle, { color: colors.text }]}>
                Already have an account?
              </Text>
              <Text style={[styles.guestSignInSubtitle, { color: colors.textSecondary }]}>
                Sign in to access live chat support with faster response times.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <LinearGradient
        colors={['#7C3AED', '#9333EA']}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <View style={styles.headerAvatarContainer}>
              {ticket?.assignedTo?.avatar ? (
                <Image
                  source={{ uri: ticket.assignedTo.avatar }}
                  style={styles.headerAvatar}
                />
              ) : (
                <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
                  <Ionicons name="headset" size={24} color="#FFF" />
                </View>
              )}
              <View style={[
                styles.headerOnlineIndicator,
                ticket?.assignedTo ? styles.onlineGreen : styles.onlineYellow
              ]} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>
                {ticket?.assignedTo?.name || 'Handwork Support'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isAgentTyping 
                  ? 'Typing...' 
                  : ticket?.assignedTo 
                    ? 'Online' 
                    : ticket?.status === 'open' 
                      ? 'Waiting for agent...'
                      : 'Support Chat'
                }
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
            <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Connecting to support...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={64} color="#9CA3AF" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsLoading(true);
              supportService.getActiveChat().then(activeChat => {
                if (activeChat) {
                  setTicket(activeChat.ticket);
                  // Deduplicate messages by ID
                  const uniqueMessages = activeChat.messages.reduce((acc: SupportMessage[], msg) => {
                    if (!acc.some(m => m.id === msg.id)) {
                      acc.push(msg);
                    }
                    return acc;
                  }, []);
                  setMessages(uniqueMessages.map(transformMessage));
                }
              }).catch(() => {
                setError('Failed to connect. Please try again.');
              }).finally(() => {
                setIsLoading(false);
              });
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chat Area */}
      {!isLoading && !error && (
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            onLayout={() => flatListRef.current?.scrollToEnd()}
            ListFooterComponent={renderTypingIndicator}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color="#E5E7EB" />
                <Text style={styles.emptyText}>Start a conversation</Text>
                <Text style={styles.emptySubtext}>
                  Send a message or use quick replies below
                </Text>
              </View>
            }
          />

          {/* Quick Replies */}
          {messages.length <= 1 && (
            <View style={[styles.quickRepliesContainer, { backgroundColor: isDark ? colors.background : '#F9FAFB' }]}>
              <Text style={[styles.quickRepliesTitle, { color: colors.textSecondary }]}>Quick Replies</Text>
              <View style={styles.quickReplies}>
                {QUICK_REPLIES.map((reply) => (
                  <TouchableOpacity
                    key={reply.id}
                    style={[styles.quickReplyButton, dynamicStyles.quickReplyContainer]}
                    onPress={() => handleQuickReply(reply)}
                  >
                    <Text style={[styles.quickReplyText, dynamicStyles.quickReplyText]}>{reply.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Input Area */}
          <View style={[styles.inputContainer, dynamicStyles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity style={styles.attachButton} onPress={handleAttachmentPress}>
              <Ionicons name="add-circle" size={28} color="#7C3AED" />
            </TouchableOpacity>
            
            <View style={[styles.inputWrapper, dynamicStyles.inputWrapper]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Type a message..."
                placeholderTextColor={colors.textSecondary}
                value={inputText}
                onChangeText={handleTextChange}
                multiline
                maxLength={500}
                onFocus={() => setIsTyping(true)}
                onBlur={() => {
                  setIsTyping(false);
                  if (ticket?.id) {
                    supportService.sendTypingIndicator(ticket.id, false);
                  }
                }}
              />
              <TouchableOpacity style={styles.emojiButton} onPress={() => setShowEmojiPicker(true)}>
                <Ionicons name="happy-outline" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() && !sendingMessage ? styles.sendButtonActive : null,
              ]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || sendingMessage}
            >
              <LinearGradient
                colors={inputText.trim() && !sendingMessage ? ['#7C3AED', '#9333EA'] : ['#E5E7EB', '#E5E7EB']}
                style={styles.sendButtonGradient}
              >
                {sendingMessage ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons 
                    name="send" 
                    size={20} 
                    color={inputText.trim() ? '#FFF' : '#9CA3AF'} 
                  />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Image Preview Modal */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.imagePreviewOverlay}>
          <TouchableOpacity
            style={styles.imagePreviewCloseButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.imagePreviewFull}
              resizeMode="contain"
              onError={(e) => console.error('[LiveChat] Preview image error:', selectedImage, e.nativeEvent.error)}
              onLoad={() => console.log('[LiveChat] Preview image loaded:', selectedImage)}
            />
          )}
        </View>
      </Modal>

      {/* Emoji Picker Modal */}
      <Modal
        visible={showEmojiPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setShowEmojiPicker(false)}
          />
          <View style={[styles.emojiPickerContainer, dynamicStyles.modalContainer]}>
            <View style={[styles.emojiPickerHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}>
              <Text style={[styles.emojiPickerTitle, dynamicStyles.modalText]}>Select Emoji</Text>
              <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.emojiPickerContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              {Object.entries(EMOJI_LIST).map(([category, emojis]) => (
                <View key={category} style={styles.emojiCategory}>
                  <Text style={[styles.emojiCategoryTitle, { color: colors.textSecondary }]}>{category}</Text>
                  <View style={styles.emojiGrid}>
                    {emojis.map((emoji, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.emojiItem}
                        onPress={() => handleEmojiPress(emoji)}
                      >
                        <Text style={styles.emojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Menu Modal */}
      <Modal
        visible={showMenuModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setShowMenuModal(false)}
          />
          <View style={[styles.menuContainer, dynamicStyles.modalContainer]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}
              onPress={() => {
                setShowMenuModal(false);
                handleViewAgentProfile();
              }}
            >
              <Ionicons name="person-outline" size={22} color={colors.text} />
              <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>View Agent Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}
              onPress={() => {
                setShowMenuModal(false);
                handleClearChat();
              }}
            >
              <Ionicons name="trash-outline" size={22} color={colors.text} />
              <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>Clear Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenuModal(false);
                handleEndChat();
              }}
            >
              <Ionicons name="close-circle-outline" size={22} color="#EF4444" />
              <Text style={[styles.menuItemText, { color: '#EF4444' }]}>End Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => {
                setShowMenuModal(false);
                handleReportIssue();
              }}
            >
              <Ionicons name="flag-outline" size={22} color="#EF4444" />
              <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Report Issue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Attachment Modal (Android) */}
      <Modal
        visible={showAttachmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setShowAttachmentModal(false)}
          />
          <View style={[styles.attachmentContainer, dynamicStyles.modalContainer]}>
            <View style={[styles.attachmentHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}>
              <Text style={[styles.attachmentTitle, dynamicStyles.modalText]}>Attach File</Text>
              <TouchableOpacity onPress={() => setShowAttachmentModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.attachmentGrid}>
              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={async () => {
                  setShowAttachmentModal(false);
                  await handleTakePhoto();
                }}
              >
                <View style={[styles.attachmentIconBg, { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : '#E0E7FF' }]}>
                  <Ionicons name="camera" size={28} color="#7C3AED" />
                </View>
                <Text style={[styles.attachmentLabel, { color: colors.textSecondary }]}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={async () => {
                  setShowAttachmentModal(false);
                  await handleChoosePhoto();
                }}
              >
                <View style={[styles.attachmentIconBg, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }]}>
                  <Ionicons name="image" size={28} color="#22C55E" />
                </View>
                <Text style={[styles.attachmentLabel, { color: colors.textSecondary }]}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={() => {
                  setShowAttachmentModal(false);
                  handleSendDocument();
                }}
              >
                <View style={[styles.attachmentIconBg, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
                  <Ionicons name="document" size={28} color="#F59E0B" />
                </View>
                <Text style={[styles.attachmentLabel, { color: colors.textSecondary }]}>Document</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={() => {
                  setShowAttachmentModal(false);
                  handleShareLocation();
                }}
              >
                <View style={[styles.attachmentIconBg, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }]}>
                  <Ionicons name="location" size={28} color="#EF4444" />
                </View>
                <Text style={[styles.attachmentLabel, { color: colors.textSecondary }]}>Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerAvatarContainer: {
    position: 'relative',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerOnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: FONTS.semiBold,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  agentMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarFallback: {
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSpacer: {
    width: 40,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#F9FAFB',
  },
  onlineGreen: {
    backgroundColor: '#10B981',
  },
  onlineYellow: {
    backgroundColor: '#F59E0B',
  },
  headerAvatarPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    fontFamily: FONTS.semiBold,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: '#7C3AED',
    borderBottomRightRadius: 4,
  },
  agentBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  agentName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  messageText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
    fontFamily: FONTS.regular,
  },
  userMessageText: {
    color: '#FFF',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: FONTS.regular,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statusIcon: {
    marginLeft: 2,
  },
  typingBubble: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  quickRepliesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quickRepliesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    fontFamily: FONTS.semiBold,
  },
  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickReplyButton: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  quickReplyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
    fontFamily: FONTS.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  attachButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    minHeight: 44,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
    fontFamily: FONTS.regular,
  },
  emojiButton: {
    paddingLeft: 8,
    paddingBottom: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonActive: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalDismissArea: {
    flex: 1,
  },
  emojiPickerContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  emojiPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  emojiPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: FONTS.semiBold,
  },
  emojiPickerContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emojiCategory: {
    marginTop: 16,
  },
  emojiCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'capitalize',
    fontFamily: FONTS.semiBold,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emojiItem: {
    width: '12.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 28,
  },
  menuContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  attachmentContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
  },
  attachmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  attachmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: FONTS.semiBold,
  },
  attachmentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  attachmentOption: {
    alignItems: 'center',
  },
  attachmentIconBg: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  attachmentLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  // Guest Contact Styles
  guestWelcomeCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  guestIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: FONTS.regular,
  },
  guestSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 12,
    marginLeft: 4,
  },
  guestContactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  guestContactIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  guestContactInfo: {
    flex: 1,
  },
  guestContactTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  guestContactSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  guestSignInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  guestSignInInfo: {
    flex: 1,
    marginLeft: 12,
  },
  guestSignInTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  guestSignInSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  // Image message styles
  imageBubble: {
    padding: 4,
    maxWidth: '70%',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Image preview modal styles
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  imagePreviewFull: {
    width: '100%',
    height: '80%',
  },
});

export default LiveChatScreen;
