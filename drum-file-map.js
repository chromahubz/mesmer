// Comprehensive drum file mappings for all drum machines
// This file can be copy-pasted into generative-music.js

const drumFileMap = {
    'AJKPercusyn': {
        kick: 'Bassdrum.wav',
        snare: 'Noise.wav',
        hihat: 'Cowbell.wav', // AJKPercusyn doesn't have standard hihats
        openhat: 'Cowbell.wav',
        cowbell: 'Cowbell.wav'
    },
    'AkaiLinn': {
        kick: 'Bassdrum.wav',
        snare: 'SD.wav',
        hihat: 'Closed Hat.wav',
        openhat: 'Open Hat.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell.wav'
    },
    'AkaiMPC60': {
        kick: '0 Bassdrum.wav',
        snare: 'Snare 1.wav',
        hihat: 'Closed Hat.wav',
        openhat: 'Open Hat.wav',
        clap: 'Clap.wav',
        rim: 'Rim Gated.wav'
    },
    'AkaiXR10': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell.wav'
    },
    'AlesisHR16': {
        kick: 'Bassdrum.wav',
        snare: 'Snaredrum.wav',
        hihat: 'Closed Hat.wav',
        openhat: 'Open Hat.wav',
        clap: 'Clap.wav',
        rim: 'Rim.wav'
    },
    'AlesisSR16': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed-01.wav',
        openhat: 'Hat Open-01.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell.wav'
    },
    'BossDR110': {
        kick: 'Bassdrum.wav',
        snare: 'Snaredrum.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav'
    },
    'BossDR220': {
        kick: 'Bassdrum.wav',
        snare: 'Snaredrum.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav'
    },
    'BossDR55': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hihat1.wav',
        openhat: 'Hihat1.wav', // DR55 doesn't have open hat
        rim: 'Rimshot.wav'
    },
    'BossDR550': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed-01.wav',
        openhat: 'Hat Open-01.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell-01.wav'
    },
    'BossDR660': {
        kick: '808AcK.wav',
        snare: '909LtS.wav',
        hihat: '78CHH.wav',
        openhat: '78OHH.wav',
        clap: '808Clap.wav',
        cowbell: '78Cow.wav'
    },
    'CasioRZ1': {
        kick: 'Bassdrum.wav',
        snare: '0Snaredrum.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell.wav'
    },
    'CasioSK1': {
        kick: 'Bassdrum.wav',
        snare: 'Snaredrum.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav'
    },
    'DoepferMS404': {
        kick: '0Bassdrum.wav',
        snare: 'Snaredrum.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav'
    },
    'EmuDrumulator': {
        kick: 'Bassdrum.wav',
        snare: '0Snaredrum.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell.wav'
    },
    'EmuSP12': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed-01.wav',
        openhat: 'Hhopen1.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell.wav'
    },
    'KorgDDM110': {
        kick: 'Bassdrum.wav',
        snare: '0Snaredrum.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav'
    },
    'KorgKPR77': {
        kick: 'Bassdrum.wav',
        snare: 'Snaredrum.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav'
    },
    'KorgKR55': {
        kick: 'Bassdrum.wav',
        snare: '0Snaredrum.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        cowbell: 'Cowbell.wav'
    },
    'KorgKRZ': {
        kick: 'Bassdrum.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav'
    },
    'KorgM1': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed-01.wav',
        openhat: 'Hat Open-01.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbel.wav'
    },
    'KorgMinipops': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed-01.wav',
        openhat: 'Hat Open-01.wav'
    },
    'KorgT3': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed-01.wav',
        openhat: 'Hat Open-01.wav',
        clap: 'Clap.wav'
    },
    'Linn9000': {
        kick: 'BAssdrum.wav',
        snare: '0Snaredrum.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        cowbell: 'Cowbell-01.wav'
    },
    'LinnDrum': {
        kick: 'Bassdrum.wav',
        snare: '0Snarderum-01.wav',
        hihat: 'Hat Closed-01.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell.wav'
    },
    'LinnLM1': {
        kick: 'LM-1_BD_1_TL.wav',
        snare: 'LM-1_SD_1_TL.wav',
        hihat: 'LM-1_HH_1_TL.wav',
        openhat: 'LM-1_HH_2_TL.wav',
        clap: 'LM-1_CLAP_1_TL.wav',
        cowbell: 'LM-1_COWBELL_TL.wav'
    },
    'LinnLM2': {
        kick: 'LM-2_BD_1_TL.wav',
        snare: 'LM-2_SD_1_TL.wav',
        hihat: 'LM-2_HH_1_TL.wav',
        openhat: 'LM-2_OPEN_HH_2_TL.wav',
        clap: 'LM-2_CLAP_1_TL.wav',
        cowbell: 'LM-2_COWBELL_1_TL.wav'
    },
    'MFB512': {
        kick: 'Bassdrum.wav',
        snare: 'Snaredrum.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav'
    },
    'MPC1000': {
        kick: 'MPC1000_808BD_TL.wav',
        snare: 'MPC1000_808SD_TL.wav',
        hihat: 'MPC1000_808HH1_TL.wav',
        openhat: 'MPC1000_909OHH_TL.wav',
        clap: 'MPC1000_CLAP_TL.wav'
    },
    'OberheimDMX': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav'
    },
    'RhythmAce': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav'
    },
    'RolandCompurhythm1000': {
        kick: 'Bassdrum.wav',
        snare: 'Snaredrum.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell.wav'
    },
    'RolandCompurhythm78': {
        kick: 'Bassdrum.wav',
        snare: 'Snaredrum.wav',
        hihat: 'Hat Closed-01.wav',
        openhat: 'Hat Open-01.wav',
        cowbell: 'Cowbell.wav'
    },
    'RolandCompurhythm8000': {
        kick: 'Bassdrum.wav',
        snare: 'Snarderum.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell.wav'
    },
    'RolandD110': {
        kick: 'Bassdrum.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        cowbell: 'Cowbell H.wav'
    },
    'RolandD70': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell.wav'
    },
    'RolandDDR30': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Bassdrum-01.wav', // DDR30 doesn't have hihat
        openhat: 'Bassdrum-01.wav'
    },
    'RolandJD990': {
        kick: 'Bryt-kck.wav',
        snare: '90\'s-sd.wav',
        hihat: 'Chh_1.wav',
        openhat: 'Lite-ohh.wav',
        clap: 'Dance-cl.wav',
        cowbell: 'Cowbell.wav'
    },
    'RolandMC303': {
        kick: '606bd1.wav',
        snare: '606sd1.wav',
        hihat: '606ch.wav',
        openhat: '707oh.wav',
        clap: '707clap.wav',
        cowbell: '78cowbel.wav'
    },
    'RolandMT32': {
        kick: 'Bassdrum.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open-01.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell.wav'
    },
    'RolandR8': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell.wav'
    },
    'RolandS50': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hihat.wav',
        openhat: 'Hihat.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell.wav'
    },
    'RolandSystem100': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed-01.wav',
        openhat: 'Hat Open-01.wav'
    },
    'RolandTR505': {
        kick: 'Bassdrum.wav',
        snare: 'Snaredrum.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell H.wav'
    },
    'RolandTR606': {
        kick: 'Bassdrum.wav',
        snare: 'Snaredrum.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav'
    },
    'RolandTR626': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell.wav'
    },
    'RolandTR707': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell.wav'
    },
    'RolandTR808': {
        kick: 'BD0000.WAV',
        snare: 'SD0000.WAV',
        hihat: 'CH.WAV',
        openhat: 'OH00.WAV',
        clap: 'cp0.wav',
        cowbell: 'CB.WAV'
    },
    'RolandTR909': {
        kick: 'Bassdrum-01.wav',
        snare: 'naredrum.wav',
        hihat: 'hh01.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav',
        rim: 'Rimhot.wav'
    },
    'SakataDPM48': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed-01.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav'
    },
    'SequentialCircuitsDrumtracks': {
        kick: 'Bassdrum.wav',
        snare: 'Snaredrum.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell.wav'
    },
    'SequentialCircuitsTom': {
        kick: 'Bassdrum.wav',
        snare: 'Snaredrum.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav'
    },
    'SimmonsSDS5': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed-01.wav',
        openhat: 'Hat Open-01.wav'
    },
    'SoundmastersR88': {
        kick: 'Bassdrum.wav',
        snare: 'Snare-1.wav',
        hihat: 'Closed Hat.wav',
        openhat: 'Open Hat.wav'
    },
    'UnivoxMicroRhythmer12': {
        kick: 'Bassdrum.wav',
        snare: 'Snaredrum.wav',
        hihat: 'Closed Hat.wav',
        openhat: 'Open Hat.wav'
    },
    'ViscoSpaceDrum': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed-01.wav',
        openhat: 'Hat Open-01.wav',
        cowbell: 'Cowbell.wav'
    },
    'XdrumLM8953': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav'
    },
    'YamahaRM50': {
        kick: 'BD-001.wav',
        snare: 'SNAREDRUM_001.wav',
        hihat: 'CYMBAL_001.wav',
        openhat: 'CYMBAL_003.wav',
        clap: 'FX_059.wav',
        cowbell: 'FX_001.wav'
    },
    'YamahaRX21': {
        kick: 'Bassdrum.wav',
        snare: 'Snaredrum.wav',
        hihat: 'Closed Hat.wav',
        openhat: 'Open hat.wav',
        clap: 'Clap.wav'
    },
    'YamahaRX5': {
        kick: 'Bassdrum-02.wav',
        snare: 'Snaredrum-02.wav',
        hihat: 'Hat Closed.wav',
        openhat: 'Hat Open.wav',
        cowbell: 'Cowbell.wav'
    },
    'YamahaRY30': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snare1.wav',
        hihat: 'Hat Closed-01.wav',
        openhat: 'Hat Open-01.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell-01.wav'
    },
    'YamahaTG33': {
        kick: 'Bassdrum-01.wav',
        snare: 'Snaredrum-01.wav',
        hihat: 'Hat Open.wav', // TG33 missing closed hat in my scan
        openhat: 'Hat Open.wav',
        clap: 'Clap.wav',
        cowbell: 'Cowbell H.wav'
    }
};
