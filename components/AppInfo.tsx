import {Image, Text, View} from 'react-native';

interface AppInfoProps {
  iconSource?: any;
  title?: string;
  cluster?: string;
  appName?: string;
  uri?: string;
  verificationText?: string;
  scope?: string;
}

function AppInfo(props: AppInfoProps) {
  const {iconSource, title, cluster, appName, uri, verificationText, scope} =
    props;
  return (
    <>
      {iconSource ? (
        <View>
          <Image source={iconSource} />
        </View>
      ) : null}
      <Text>{title}</Text>
      <View>
        <Text>Request Metadata</Text>
        <Text>Cluster: {cluster}</Text>
        <Text>App name: {appName}</Text>
        <Text>App URI: {uri}</Text>
        <Text>Status: {verificationText}</Text>
        <Text>Scope: {scope}</Text>
      </View>
    </>
  );
}

export default AppInfo;
