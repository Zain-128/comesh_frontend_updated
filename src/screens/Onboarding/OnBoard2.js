import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useDispatch } from "react-redux";
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import Container from '../../components/Container';
import RadioButton from '../../components/RadioButton';
import Text from '../../components/Text';
import { setUser } from '../../redux/userSlice';


const data = [
  { Q: "Are you a full time content creator, or just for fun?", options: ["Fulltime content creator", "Just for fun"], selected: "Fulltime content creator" },
  { Q: "Select which applies?", options: ["Live streamer", "Video Creator", "Both"], selected: "Live streamer" },
  { Q: "Do you understand, this is not a dating app?", options: ["Yes", "No"], selected: "Yes" },
  { Q: "How often do you make content?", options: ["1-2 days/weekly", "3-4 days/weekly", "Randomly just for fun"], selected: "1-2 days/weekly" },
]

const OnBoard2 = (props) => {
  const [questions, setQuestions] = useState(data);
  const dispatch = useDispatch();

  return (
    <Container
      header
      steps={require("../../assets/images/Steps2.png")}
      {...props}
      SkipToScreen="OnBoard3"
    >
      <ScrollView>
        <View style={{ flex: 1, padding: "5%" }}>
          <Text style={{ fontWeight: "bold", fontSize: 22 }} >
            You're doing great! Just a couple
            more steps
          </Text>
          <View style={{ flex: 1, paddingVertical: '8%', gap: 20 }}>
            {
              questions.map((v, i) => (
                <View style={{ gap: 12 }}>
                  <Text style={{ fontWeight: "500", fontSize: 16 }}>Q.{i + 1} {v.Q}</Text>
                  {
                    v.options.map((o) => (
                      <RadioButton label={o} checked={v.selected == o} onPress={(val) => {
                        let questionsCopy = [...questions];
                        let question = { ...questionsCopy[i] };
                        question.selected = o;
                        questionsCopy.splice(i, 1, question)
                        setQuestions(questionsCopy)
                      }} />
                    ))
                  }
                </View>
              ))
            }
          </View>
          <PrimaryButton
            text={'Continue'}
            onPress={() => {
              dispatch(setUser({
                questionAndAnswers: questions.map((v) => ({
                  question: v.Q,
                  answer: v.selected
                }))
              }));
              props.navigation.navigate('OnBoard3')
            }}
          />
        </View>
      </ScrollView>
    </Container>
  )
};

export default OnBoard2;
