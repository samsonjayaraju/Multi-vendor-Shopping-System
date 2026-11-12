#!/usr/bin/env bash
set -e
ECLIPSE_PLUGINS="/Applications/SpringToolsForEclipse.app/Contents/Eclipse/plugins"
M2E_JARS="$ECLIPSE_PLUGINS/org.eclipse.m2e.maven.runtime_3.9.1601.20260722-2149/jars"
CONF_FILE="/tmp/multivendor_m2.conf"
cat << 'M2CONF' > "$CONF_FILE"
main is org.apache.maven.cli.MavenCli from plexus.core

set maven.conf default /tmp

[plexus.core]
load /Applications/SpringToolsForEclipse.app/Contents/Eclipse/plugins/org.eclipse.m2e.maven.runtime_3.9.1601.20260722-2149/jars/*.jar
load /Applications/SpringToolsForEclipse.app/Contents/Eclipse/plugins/org.apache.commons.cli_1.11.0.jar
load /Applications/SpringToolsForEclipse.app/Contents/Eclipse/plugins/org.apache.commons.commons-codec_1.22.1.jar
load /Applications/SpringToolsForEclipse.app/Contents/Eclipse/plugins/com.google.guava_33.7.1.jre.jar
load /Applications/SpringToolsForEclipse.app/Contents/Eclipse/plugins/com.google.guava.failureaccess_1.0.3.jar
load /Applications/SpringToolsForEclipse.app/Contents/Eclipse/plugins/jakarta.inject.jakarta.inject-api_1.0.5.jar
load /Applications/SpringToolsForEclipse.app/Contents/Eclipse/plugins/jakarta.annotation-api_1.3.5.jar
load /Users/samson/.m2/repository/org/slf4j/slf4j-api/1.7.36/slf4j-api-1.7.36.jar
M2CONF

exec java -cp "$M2E_JARS/plexus-classworlds-2.11.0.jar" \
  -Dclassworlds.conf="$CONF_FILE" \
  -Dmaven.home="/tmp" \
  -Dmaven.multiModuleProjectDirectory="$PWD" \
  org.codehaus.plexus.classworlds.launcher.Launcher "$@"
