# install yasm, libmp3lame-dev(and trash .so to use .a)

./configure \
	--disable-everything \
	--disable-ffprobe \
	--disable-ffserver \
	--enable-static \
	--enable-libmp3lame \
	--extra-ldflags=-Llib \
	--enable-protocol=file \
	--enable-decoder=mp3 \
	--enable-decoder=mp3float \
	--enable-decoder=mp3adu \
	--enable-decoder=mp3adufloat \
	--enable-decoder=mp3on4 \
	--enable-decoder=mp3on4float \
	--enable-decoder=mp3_at \
	--enable-demuxer=mp3 \
	--enable-encoder=libmp3lame \
	--enable-muxer=mp3 \
	--enable-filter=aresample

