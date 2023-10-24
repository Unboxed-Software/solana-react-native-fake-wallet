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
        <Text>Cluster: {cluster ? cluster : 'NA'}</Text>
        <Text>App name: {appName ? appName : 'NA'}</Text>
        <Text>App URI: {uri ? uri : 'NA'}</Text>
        <Text>Status: {verificationText ? verificationText : 'NA'}</Text>
        <Text>Scope: {scope ? scope : 'NA'}</Text>
      </View>
    </>
  );
}

export default AppInfo;
