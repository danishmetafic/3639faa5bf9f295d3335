import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Dimensions,
  Platform,
  PixelRatio,
  TextInput,
  Modal
} from 'react-native';

import {
  Title,
  Container,
  Card,
  CardItem,
  Body,
  Text,
  Left,
  Button,
  Icon,
  Right,
  Header
} from 'native-base';

import moment from 'moment';

const POSTS_URL = 'https://hn.algolia.com/api/v1/search_by_date?tags=story';

const { width, height } = Dimensions.get('window');

// based on iphone 5s's scale
const scale = width / 320;

const normalize = (size) => {
  const newSize = size * scale 
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize))
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2
  }
}


export default class Main extends Component {
  
  constructor(props) {
    super(props);
    
    this.state = { 
      data : [],
      loading:false,
      filtered:false,
      page:0,
      error:false,
      errorText:null,
      search:null,
      viewSingle:false,
      viewSingleData:{}
    };
    
    this.mount = true;
  }

  getPosts(){
    const { page } = this.state;
    if(this.mount) {
      fetch(POSTS_URL+'&page='+page)
       .then((response) => response.json())
       .then((json) => {
         const { page, data } = this.state;

          this.setState({ 
            data: data.concat(json.hits),
            page: page+1
          });

        })
        .catch((error) => {
          this.setState({
           loading: false,
           error:true,
           errorText:error.toString()
          });
        })
        .finally(() => {
         this.setState({ loading: false });
        });
    }
  }

  

  componentDidMount(){
    let self = this;
    this.getPosts();
    
    
    this.setinterval = setInterval(function(){
      self.getPosts();
    }, 10000);
    
  }

  componentWillUnmount(){
    this.mount = false;
    clearInterval(this.setinterval);
  }

  onPaginate(){
    const { page } = this.state;
    this.getPosts(page+1);
  }

  onChangeText(search){
    if(search!=''){
      this.setState({search, filtered:true});
    }
    else{
      this.setState({search, filtered:false});
    }
  }

  renderItem(row){
    const {item} = row;
    
    return (<Card key={item.objectID} >
            <CardItem button  onPress={() => this.setState({viewSingle:true, viewSingleData:item})}>
              <Left>
                <Body>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.url} note>{item.url}</Text>
                </Body>
              </Left>
            </CardItem>
            <CardItem>
              <Left>
                  <View style={styles.authorWrapper}>
                    <Text style={styles.by}>by</Text>
                    <Text style={styles.authorName}>{item.author}</Text>
                  </View>
              </Left>
              <Right>
                <Text>{moment(item.created_at).format('Do MMM YYYY')}</Text>
              </Right>
            </CardItem>
          </Card>);
  }  

  renderList(){
    const { data, filtered, search } = this.state;
    let renderedList = null;

    

    if(data.length>0){
      let finalData = [];
      if(filtered){

        let filter = search.toLowerCase();

        finalData = data.filter((item)=>{
          let title   = item.title.toLowerCase();
          let author  = item.author.toLowerCase();
          
          if(item!=null && title.indexOf(filter)!=-1)
          return item;
          
          if(item!=null && author.indexOf(filter)!=-1)
          return item;
        });

        
      }
      else{
        finalData = data;
      }

      if(finalData.length>0)
      return (<FlatList
          ListHeaderComponent={<Text style={{position:'absolute',top:0}}>{this.state.data.length}</Text>}
          onEndReachedThreshold="0.75"
          onEndReached={()=>this.onPaginate()}
          contentContainerStyle={styles.list}
          data={finalData}
          renderItem={(row)=>this.renderItem(row)}
          keyExtractor={item => item.objectID}
        />);
      else if(search!='' && filtered==true)
        return <Text style={styles.noItems}>No Matching Items</Text>

    }
    

  }


  renderSingle(){
    const { viewSingleData } = this.state;

    return <Modal visible={true}
    onRequestClose={() => {
      this.setState({viewSingle:false, viewSingleData:{}});
    }}><Text style={{padding:20}}>{JSON.stringify(viewSingleData)}</Text></Modal>
  }

  render(){
    return <Container>
            <Header>
              <Body>
                <TextInput
                  placeholder="Search by title, url, author"
                  onChangeText={text => this.onChangeText(text)}
                  value={this.state.search}
                />
              </Body>
            </Header>
            {this.state.viewSingle?
            this.renderSingle():this.renderList()}
          </Container>;
  }
}

const styles = StyleSheet.create({
  list:{
    paddingBottom:55,
  },
  authorWrapper:{
    flexDirection:'row',
    justifyContent:"flex-start"
  },
  by:{
    fontSize:normalize(11),
    color:'#ccc'
  },
  authorName:{
    fontSize:normalize(12),
    color:'#333'
  },
  rowWrapper:{

  },
  title:{
    fontSize:normalize(14)
  },
  url:{
    fontSize:normalize(12)
  },
  noItems:{
    textAlign:'center',
    fontSize:normalize(20),
    marginVertical:normalize(50),
    flex:1,
  }
});