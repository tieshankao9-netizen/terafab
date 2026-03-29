import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type SiteLocale = 'en' | 'fr' | 'zh'

const STORAGE_KEY = 'terafab_site_locale'

const LOCALE_TAGS: Record<SiteLocale, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  zh: 'zh-CN',
}

const HTML_LANG: Record<SiteLocale, string> = {
  en: 'en',
  fr: 'fr',
  zh: 'zh-CN',
}

export const SITE_LANGUAGE_OPTIONS: Array<{ value: SiteLocale; label: string }> = [
  { value: 'en', label: 'EN' },
  { value: 'fr', label: 'FR' },
  { value: 'zh', label: '中' },
]

const SITE_COPY = {
  en: {
    meta: {
      title: 'TERAFAB — Interactive Fan Mission',
      description:
        'Terafab.top is an interactive entertainment mission on BNB Chain. Charge the ship, join the supporter board, and verified on-chain supporters may be considered for future commemorative NFT or community airdrop experiments.',
    },
    header: {
      board: 'Supporter Board',
      domain: 'Domain',
      boostsLogged: 'boosts logged',
      language: 'Language',
    },
    home: {
      sceneLoading: 'INITIALIZING INTERACTIVE EXPERIENCE...',
      missionBadge: 'Interactive Fan Mission',
      entertainmentBadge: 'Entertainment First',
      tagline: '.TOP — THE PLAYGROUND FOR MARS FANS',
      description:
        'Terafab is a playful fan mission built for entertainment first. Tap once to charge the ship, trigger launch theatrics, and leave your callsign in the mission log.',
      descriptionAccent:
        'Verified on-chain supporters may be snapshotted for future commemorative NFT drops and community airdrop experiments.',
      leaderboardCta: 'View Supporter Board',
      chainBadge: 'BNB Chain · USDT support · on-chain receipts',
      entertainmentNote:
        'Built as an interactive entertainment experience for space fans. It is not a formal investment program.',
      nftHint:
        'If your on-chain support is verified, you may be included in future NFT snapshot lists or community airdrop experiments. Not guaranteed.',
      showCardTitle: 'Entertainment First',
      showCardBody: 'Boosts, launch effects, rankings, and board moments are all part of the show.',
      airdropCardTitle: 'Future NFT Snapshot',
      airdropCardBody:
        'Verified supporters may be shortlisted for commemorative NFT drops or supporter airdrop experiments in future campaigns.',
      infoDomain: 'Domain',
      infoChain: 'Chain',
      infoToken: 'Token',
      footer: '© 2026 TERAFAB · INTERACTIVE FAN MISSION',
    },
    energy: {
      title: 'IGNITION ENERGY',
      totalBoosts: 'TOTAL BOOSTS',
      target: 'TARGET',
      phases: {
        idle: 'STANDBY',
        charging: 'CHARGING',
        countdown: 'T-MINUS',
        ignition: 'IGNITION',
        launched: 'LAUNCHED',
        boosting: 'BOOSTING',
      },
      ignitionBanner: '🔥 MAIN ENGINE START — T-0 🔥',
      launchedBanner: '🚀 TERAFAB IS AIRBORNE — ORBIT ACHIEVED',
      countdownBanner: '⚡ CRITICAL ENERGY — LAUNCH IMMINENT ⚡',
    },
    launch: {
      alreadyVoted: 'You already boosted once. One boost per person.',
      button: {
        submitting: 'Boosting...',
        afterLaunch: '🚀 Booster ready',
        voted: '✅ Boost registered',
        ignition: '🔥 Igniting...',
        critical: '⚡ Critical energy! Ignite!',
        idle: '🚀 Add launch energy',
      },
      hints: {
        singleVote: 'One boost per person. Every boost still counts.',
        afterLaunch: 'The ship is already up. Every extra boost becomes part of the show.',
      },
      status: {
        cold: 'cold start',
        charging: 'charging',
        nearCritical: 'near critical',
        ready: 'ready to ignite',
      },
      live: 'LIVE',
      offline: 'OFFLINE',
    },
    hud: {
      title: 'Mission Telemetry',
      thrust: 'Thrust',
      fuel: 'Fuel',
      altitude: 'Altitude',
      velocity: 'Velocity',
      engineTemp: 'Eng Temp',
      energy: 'Energy',
      sysOk: 'SYS_OK',
    },
    overlay: {
      ignitionTitle: 'IGNITION',
      ignitionSubtitle: 'MAIN ENGINE START',
      successTitle: '🚀 TERAFAB IS FLYING — ORBIT ACHIEVED',
      successSubtitle: 'Keep boosting · leave your name in orbit',
    },
    leaderboard: {
      title: 'Supporter Board',
      subtitle: 'VERIFIED SUPPORTERS · HALL OF FAME',
      totalSupport: 'Total Support',
      sampleBanner:
        'Sample supporter lineup shown while verified on-chain donations are warming up.',
    },
    donate: {
      steps: {
        connecting: 'Connecting wallet...',
        switching_chain: 'Switching to BNB Chain...',
        sending: 'Waiting for wallet approval...',
        confirming: 'Waiting for on-chain confirmation...',
        submitting: 'Submitting to the board...',
        success: 'Board entry confirmed!',
        error: 'Something went wrong',
      },
      errors: {
        noWallet: 'No browser wallet detected. Install MetaMask or Coinbase Wallet first.',
        connectFailed: 'Wallet connection failed. Please try again.',
        walletAddressMissing: 'Unable to load the recipient address. Please contact the admin.',
        walletNotConnected: 'Connect a wallet first.',
        userRejected: 'You cancelled the transaction. You can try again anytime.',
      },
      energyBoost: (energyPercent: number) => `Launch energy +1% -> ${energyPercent}%`,
      title: 'The ship is almost ready!',
      body:
        'This is a playful community entertainment mission. Support with USDT to appear on the supporter board and fuel the show.',
      entertainmentNote:
        'Entertainment-first project. Your support powers the experience, the visuals, and the public supporter board.',
      airdropHintTitle: 'Possible Future NFT Perk',
      airdropHintBody:
        'Verified on-chain supporters may be included in future commemorative NFT or community airdrop snapshot experiments. This is a possibility, not a promise.',
      walletConnectHint:
        'Browser wallet mode is active. Set `VITE_WALLETCONNECT_PROJECT_ID` to enable WalletConnect.',
      joinBoard: 'Join the board',
      maybeLater: 'Maybe later',
      nameLabel: 'Display name',
      namePlaceholder: 'Your name / callsign',
      amountLabel: 'Support amount (USDT · BEP-20)',
      customAmount: 'Custom amount',
      submitConnected: 'Confirm and send USDT',
      submitDisconnected: 'Connect wallet to support',
      back: 'Back',
      viewTx: 'View on BscScan',
      successTitle: 'Board entry confirmed!',
      successBody:
        'Your support is now on the Terafab board. Keep your receipt: verified supporters may be reviewed for future NFT or airdrop experiments.',
      viewProof: 'View on-chain receipt',
      close: 'Close',
      retry: 'Try again',
      walletChain: 'BNB Chain',
    },
  },
  fr: {
    meta: {
      title: 'TERAFAB — Mission Fan Interactive',
      description:
        'Terafab.top est une experience interactive de divertissement sur BNB Chain. Chargez le vaisseau, rejoignez le tableau des soutiens, et certains soutiens verifies pourront etre consideres pour de futurs NFT commemoratifs ou tests de largage communautaire.',
    },
    header: {
      board: 'Tableau Des Soutiens',
      domain: 'Domaine',
      boostsLogged: 'boosts enregistres',
      language: 'Langue',
    },
    home: {
      sceneLoading: "INITIALISATION DE L'EXPERIENCE INTERACTIVE...",
      missionBadge: 'Mission Fan Interactive',
      entertainmentBadge: 'Pur Divertissement',
      tagline: '.TOP — LE TERRAIN DE JEU DES FANS DE MARS',
      description:
        'Terafab est une mission fan ludique pensee avant tout comme un divertissement. Touchez une fois pour charger le vaisseau, declencher les effets de lancement et laisser votre indicatif dans le journal de mission.',
      descriptionAccent:
        'Les soutiens verifies on-chain pourront etre pris en compte dans de futurs snapshots NFT commemoratifs et tests de largage communautaire.',
      leaderboardCta: 'Voir Le Tableau',
      chainBadge: 'BNB Chain · soutien USDT · preuves on-chain',
      entertainmentNote:
        "Experience interactive de divertissement pour les fans de l'espace, et non programme d'investissement.",
      nftHint:
        'Si votre soutien on-chain est verifie, il pourra etre inclus dans de futurs snapshots NFT ou tests de largage communautaire. Sans garantie.',
      showCardTitle: 'Divertissement DAbord',
      showCardBody:
        'Boosts, effets de lancement, classement et moments du tableau font partie du spectacle.',
      airdropCardTitle: 'Snapshot NFT Futur',
      airdropCardBody:
        'Les soutiens verifies pourront etre retenus pour de futurs NFT commemoratifs ou tests de largage reserves aux supporters.',
      infoDomain: 'Domaine',
      infoChain: 'Chaine',
      infoToken: 'Jeton',
      footer: '© 2026 TERAFAB · MISSION FAN INTERACTIVE',
    },
    energy: {
      title: "ENERGIE D'ALLUMAGE",
      totalBoosts: 'BOOSTS TOTAUX',
      target: 'OBJECTIF',
      phases: {
        idle: 'VEILLE',
        charging: 'CHARGE',
        countdown: 'T-MOINS',
        ignition: 'ALLUMAGE',
        launched: 'EN VOL',
        boosting: 'SURBOOST',
      },
      ignitionBanner: '🔥 DEMARRAGE DU MOTEUR PRINCIPAL — T-0 🔥',
      launchedBanner: '🚀 TERAFAB A DECOLLE — ORBITE ATTEINTE',
      countdownBanner: '⚡ ENERGIE CRITIQUE — LANCEMENT IMMINENT ⚡',
    },
    launch: {
      alreadyVoted: 'Vous avez deja booste une fois. Un boost par personne.',
      button: {
        submitting: 'Boost en cours...',
        afterLaunch: '🚀 Booster pret',
        voted: '✅ Boost enregistre',
        ignition: '🔥 Allumage...',
        critical: '⚡ Energie critique ! Allumage !',
        idle: "🚀 Ajouter de l'energie",
      },
      hints: {
        singleVote: 'Un boost par personne. Chaque boost compte.',
        afterLaunch: 'Le vaisseau est deja en vol. Chaque boost supplementaire nourrit le spectacle.',
      },
      status: {
        cold: 'demarrage a froid',
        charging: 'en charge',
        nearCritical: 'pres du seuil critique',
        ready: 'pret a allumer',
      },
      live: 'LIVE',
      offline: 'HORS LIGNE',
    },
    hud: {
      title: 'Telemetrie Mission',
      thrust: 'Poussee',
      fuel: 'Carburant',
      altitude: 'Altitude',
      velocity: 'Vitesse',
      engineTemp: 'Temp Moteur',
      energy: 'Energie',
      sysOk: 'SYS_OK',
    },
    overlay: {
      ignitionTitle: 'ALLUMAGE',
      ignitionSubtitle: 'DEMARRAGE DU MOTEUR PRINCIPAL',
      successTitle: '🚀 TERAFAB EST EN VOL — ORBITE ATTEINTE',
      successSubtitle: 'Continuez a booster · laissez votre nom en orbite',
    },
    leaderboard: {
      title: 'Tableau Des Soutiens',
      subtitle: 'SOUTIENS VERIFIES · HALL OF FAME',
      totalSupport: 'Soutien Total',
      sampleBanner:
        "Exemples de soutiens affiches pendant l'arrivee des premieres donations verifiees on-chain.",
    },
    donate: {
      steps: {
        connecting: 'Connexion du wallet...',
        switching_chain: 'Passage sur BNB Chain...',
        sending: "En attente de l'approbation du wallet...",
        confirming: 'Confirmation on-chain en cours...',
        submitting: 'Envoi vers le tableau...',
        success: 'Entree confirmee !',
        error: 'Une erreur est survenue',
      },
      errors: {
        noWallet: "Aucun wallet navigateur detecte. Installez MetaMask ou Coinbase Wallet.",
        connectFailed: 'Echec de connexion au wallet. Reessayez.',
        walletAddressMissing: "Impossible de charger l'adresse de reception. Contactez l'admin.",
        walletNotConnected: "Connectez d'abord un wallet.",
        userRejected: 'Vous avez annule la transaction. Vous pourrez reessayer plus tard.',
      },
      energyBoost: (energyPercent: number) => `Energie +1% -> ${energyPercent}%`,
      title: 'Le vaisseau est presque pret !',
      body:
        'Ceci est une mission communautaire de divertissement. Soutenez avec des USDT pour apparaitre dans le tableau et alimenter le show.',
      entertainmentNote:
        'Projet axe divertissement. Votre soutien alimente lexperience, les visuels et le tableau public des supporters.',
      airdropHintTitle: 'Avantage NFT Eventuel',
      airdropHintBody:
        'Les soutiens verifies on-chain pourront etre inclus dans de futurs snapshots NFT commemoratifs ou tests de largage communautaire. Cest une possibilite, pas une promesse.',
      walletConnectHint:
        'Le mode wallet navigateur est actif. Definissez `VITE_WALLETCONNECT_PROJECT_ID` pour activer WalletConnect.',
      joinBoard: 'Rejoindre le tableau',
      maybeLater: 'Plus tard',
      nameLabel: "Nom d'affichage",
      namePlaceholder: 'Votre nom / indicatif',
      amountLabel: 'Montant du soutien (USDT · BEP-20)',
      customAmount: 'Montant libre',
      submitConnected: 'Confirmer et envoyer des USDT',
      submitDisconnected: 'Connecter un wallet',
      back: 'Retour',
      viewTx: 'Voir sur BscScan',
      successTitle: 'Entree confirmee !',
      successBody:
        'Votre soutien est maintenant visible dans le tableau Terafab. Conservez votre preuve: les soutiens verifies pourront etre examines pour de futurs NFT ou tests de largage.',
      viewProof: 'Voir la preuve on-chain',
      close: 'Fermer',
      retry: 'Reessayer',
      walletChain: 'BNB Chain',
    },
  },
  zh: {
    meta: {
      title: 'TERAFAB — 互动娱乐任务',
      description:
        'Terafab.top 是一个部署在 BNB 链上的互动娱乐任务。你可以为飞船充能、进入支持者光荣榜，已验证的链上支持者未来还有机会被纳入纪念 NFT 或社区空投实验名单。',
    },
    header: {
      board: '光荣榜',
      domain: '域名',
      boostsLogged: '次助力记录',
      language: '语言',
    },
    home: {
      sceneLoading: '正在初始化互动体验...',
      missionBadge: '互动娱乐任务',
      entertainmentBadge: '娱乐体验优先',
      tagline: '.TOP — 面向火星粉丝的互动游乐场',
      description:
        'Terafab 是一个以娱乐体验为主的互动粉丝任务。点一次火力，给飞船充能，触发起飞特效，并把你的代号留在任务日志里。',
      descriptionAccent:
        '已验证的链上支持者，未来有机会进入纪念 NFT 快照或社区空投实验名单。',
      leaderboardCta: '查看光荣榜',
      chainBadge: 'BNB 链 · USDT 支持 · 链上凭证',
      entertainmentNote: '这是一个面向太空爱好者的互动娱乐体验，不是正式投资项目。',
      nftHint: '如果你的链上支持被验证，未来可能会被纳入纪念 NFT 快照或社区空投实验名单，但不作保证。',
      showCardTitle: '娱乐体验优先',
      showCardBody: '点赞、点火特效、榜单展示和任务节奏，本质上都是这场互动秀的一部分。',
      airdropCardTitle: '未来 NFT 快照',
      airdropCardBody: '已验证支持者未来可能进入纪念 NFT 空投或支持者专属空投实验名单，用于后续活动快照。',
      infoDomain: '域名',
      infoChain: '区块链',
      infoToken: '代币',
      footer: '© 2026 TERAFAB · 互动娱乐任务',
    },
    energy: {
      title: '点火能量',
      totalBoosts: '总助力数',
      target: '目标值',
      phases: {
        idle: '待机',
        charging: '充能中',
        countdown: '临界倒计时',
        ignition: '点火',
        launched: '已升空',
        boosting: '持续助推',
      },
      ignitionBanner: '🔥 主引擎点火 — T-0 🔥',
      launchedBanner: '🚀 TERAFAB 已升空 — 轨道达成',
      countdownBanner: '⚡ 能量临界 — 即将点火 ⚡',
    },
    launch: {
      alreadyVoted: '你已经助力过一次了，每人限一次。',
      button: {
        submitting: '助推中...',
        afterLaunch: '🚀 助推器就绪',
        voted: '✅ 助力已记录',
        ignition: '🔥 点火中...',
        critical: '⚡ 能量临界！立即点火！',
        idle: '🚀 增加点火能量',
      },
      hints: {
        singleVote: '每个人只能助力一次，但每一次都算数。',
        afterLaunch: '飞船已经升空，之后的每次助推都会成为表演的一部分。',
      },
      status: {
        cold: '冷启动',
        charging: '蓄能中',
        nearCritical: '接近临界',
        ready: '准备点火',
      },
      live: '在线',
      offline: '离线',
    },
    hud: {
      title: '任务遥测',
      thrust: '推力',
      fuel: '燃料',
      altitude: '高度',
      velocity: '速度',
      engineTemp: '引擎温度',
      energy: '能量',
      sysOk: '系统正常',
    },
    overlay: {
      ignitionTitle: '点火',
      ignitionSubtitle: '主引擎启动',
      successTitle: '🚀 TERAFAB 已升空 — 轨道达成',
      successSubtitle: '继续助推 · 让名字留在星际轨道',
    },
    leaderboard: {
      title: '光荣榜',
      subtitle: '已验证支持者 · 荣耀席位',
      totalSupport: '总支持额',
      sampleBanner: '当前展示的是示例支持者列表，真实链上捐赠验证完成后会自动替换。',
    },
    donate: {
      steps: {
        connecting: '正在连接钱包...',
        switching_chain: '正在切换到 BNB 链...',
        sending: '等待钱包确认...',
        confirming: '等待链上确认...',
        submitting: '正在提交到光荣榜...',
        success: '已成功上榜！',
        error: '发生错误',
      },
      errors: {
        noWallet: '未检测到浏览器钱包，请先安装 MetaMask 或 Coinbase Wallet。',
        connectFailed: '钱包连接失败，请重试。',
        walletAddressMissing: '无法获取收款地址，请联系管理员。',
        walletNotConnected: '请先连接钱包。',
        userRejected: '你取消了交易，稍后还可以再试一次。',
      },
      energyBoost: (energyPercent: number) => `点火能量 +1% -> ${energyPercent}%`,
      title: '飞船蓄势待发！',
      body:
        '这是一个偏娱乐向的社区互动任务。你可以用 USDT 支持 Terafab，把名字写进支持者光荣榜，并为整场互动秀加一把火。',
      entertainmentNote:
        '这是一个娱乐优先项目，你的支持会直接推动页面演出、视觉效果和公开支持者榜单。',
      airdropHintTitle: '未来 NFT / 空投可能性',
      airdropHintBody:
        '已验证的链上支持者，未来可能会被纳入纪念 NFT 空投快照或社区空投实验名单。这是可能性，不是承诺。',
      walletConnectHint:
        '当前为浏览器钱包直连模式；如需 WalletConnect，请配置 `VITE_WALLETCONNECT_PROJECT_ID`。',
      joinBoard: '进入光荣榜',
      maybeLater: '下次再说',
      nameLabel: '光荣榜显示名称',
      namePlaceholder: '你的名字 / 代号',
      amountLabel: '支持金额 (USDT · BEP-20)',
      customAmount: '自定义金额',
      submitConnected: '确认并发送 USDT',
      submitDisconnected: '连接钱包并支持',
      back: '返回',
      viewTx: '在 BscScan 查看交易',
      successTitle: '已成功上榜！',
      successBody: '你的支持已经写入 Terafab 光荣榜。请保留交易凭证，已验证支持者未来可能会被纳入 NFT 或空投实验名单。',
      viewProof: '查看链上凭证',
      close: '关闭',
      retry: '重试',
      walletChain: 'BNB 链',
    },
  },
} as const

type SiteCopy = (typeof SITE_COPY)[SiteLocale]

interface SiteLanguageValue {
  locale: SiteLocale
  setLocale: (locale: SiteLocale) => void
  copy: SiteCopy
  formatNumber: (value: number) => string
  formatDate: (value: string) => string
}

const SiteLanguageContext = createContext<SiteLanguageValue | null>(null)

export function SiteLanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<SiteLocale>(() => {
    if (typeof window === 'undefined') return 'en'

    const storedLocale = window.localStorage.getItem(STORAGE_KEY)
    if (storedLocale === 'en' || storedLocale === 'fr' || storedLocale === 'zh') {
      return storedLocale
    }

    return 'en'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem(STORAGE_KEY, locale)
    document.documentElement.lang = HTML_LANG[locale]
    document.title = SITE_COPY[locale].meta.title

    const descriptionTag = document.querySelector('meta[name="description"]')
    if (descriptionTag) {
      descriptionTag.setAttribute('content', SITE_COPY[locale].meta.description)
    }
  }, [locale])

  const value: SiteLanguageValue = {
    locale,
    setLocale,
    copy: SITE_COPY[locale],
    formatNumber: (input: number) => input.toLocaleString(LOCALE_TAGS[locale]),
    formatDate: (input: string) =>
      new Date(input).toLocaleDateString(LOCALE_TAGS[locale], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
  }

  return (
    <SiteLanguageContext.Provider value={value}>
      {children}
    </SiteLanguageContext.Provider>
  )
}

export function useSiteLanguage() {
  const value = useContext(SiteLanguageContext)
  if (!value) {
    throw new Error('useSiteLanguage must be used within SiteLanguageProvider')
  }

  return value
}
