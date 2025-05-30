function isAudioFile(buffer) {
    // Ensure the buffer is long enough to contain the magic number
    if (!Buffer.isBuffer(buffer)) {
        throw new TypeError('Expected a Buffer');
    }
    if (buffer.length < 2) {
        return false;
    }

    // Convert the first few bytes to a hex string
    const signature = buffer.subarray(0, 4).toString('hex').toUpperCase();

    // Audio file signatures
    const audioSignatures = [
        '494433', // ID3 tag for MP3
        'FFFB', // Another possible MP3 signature
        'FFF3', // Another possible MP3 signature
        'FFF2', // Another possible MP3 signature
        '52494646', // RIFF header for WAV
        '4F676753', // OGG container
        '66747970', // MP4 container
        // Add more audio file signatures as needed
    ];

    // Check if the signature matches any known audio file type
    return audioSignatures.some(magicNumber => signature.startsWith(magicNumber));
}

module.exports = {
    isAudioFile
};