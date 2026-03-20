import { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import SectionedMultiSelect from 'react-native-sectioned-multi-select';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../constants/colors';
import { Typography } from './Typography';
export const SelectPicker = ({ label, options, disabled = false, dropDownStyle, style, val, onValueChange, multiple = false }) => {
  const [items, setItems] = useState([]);
  const dpRef = useRef(null);

  useEffect(() => {
    setItems(val ? val : [])
  }, [val])


  return (
    <View style={{ gap: 10, ...style }}>
      {label &&
        <Typography textType="semiBold" color="#A5A7AB" children={label} />
      }
      <View
        style={{
          borderRadius: 50,
          backgroundColor: '#fff',
          elevation: 4,
          shadowColor: '#aaaa',
          shadowOpacity: 0.4,
          shadowRadius: 5,
          shadowOffset: {
            width: 3,
            height: 3
          },
          height: 50,
          justifyContent: "center",
          paddingHorizontal: 10
        }}>
        {disabled ? (
          <Typography children={val ? val : options[0]} style={{ padding: 15 }} />
        ) :
          //_toggleSelector()
          <SectionedMultiSelect
            ref={dpRef}
            IconRenderer={Icon}
            items={options}
            uniqueKey="value"
            displayKey='label'
            subKey="children"
            selectText={"Select..."}
            showDropDowns={true}
            onSelectedItemsChange={(selectedItems) => {
              onValueChange(selectedItems);
              setItems(selectedItems)
            }}
            selectedItems={items}
            modalWithSafeAreaView
            searchPlaceholderText='Search...'
            confirmText='Save'
            showRemoveAll
            modalWithTouchable
            headerComponent={options?.length < 10 && <View style={{ padding: 15, flexDirection: "row", justifyContent: "space-between" }}>
              <Typography size={16} textType='bold' children="Select an option" />
              <TouchableOpacity onPress={() => { dpRef.current._toggleSelector() }}>
                <Icon name='close' size={20} color='#aaa' />
              </TouchableOpacity>
            </View>}
            hideSearch={options?.length < 10}
            showChips={false}
            single={!multiple}
            hideConfirm={!multiple}
            styles={{
              item: {
                padding: 10,
                paddingVertical: 10
              },
              itemText: {
                fontWeight: "normal"
              },
              button: {
                backgroundColor: colors.secondary
              },
              selectedItem: {
                backgroundColor: "#eee",
              },
              selectToggle: {
                margin: 0,
              },
              selectToggleText: {
                fontSize: 14
              }
            }}
          />
          // (
          //   multiple ?
          //     <DropDownPicker
          //       badgeDotColors={colors.primary}
          //       closeOnBackPressed={true}
          //       dropDownDirection="BOTTOM"
          //       open={open}
          //       value={value}
          //       items={items}
          //       setOpen={setOpen}
          //       setValue={setValue}
          //       setItems={setItems}
          //       disableBorderRadius
          //       multiple={multiple}
          //       containerStyle={{
          //         zIndex: 1111111111,
          //         ...dropDownStyle
          //       }}
          //       style={{
          //         backgroundColor: "#fff",
          //         borderRadius: 50,
          //         borderWidth: 0,
          //       }}
          //       placeholder='Select multiple items'
          //       placeholderStyle={{ color: "#5c5c5c" }}
          //       dropDownContainerStyle={{
          //         backgroundColor: "#fff",
          //         borderWidth: 0,
          //       }}
          //     />
          //     :
          //     <RNPickerSelect
          //       onValueChange={(value) => setValue(value)}
          //       items={items}
          //       value={value}
          //       Icon={() => <MaterialCommunityIcons name='chevron-thin-down' size={15} />}
          //       style={{
          //         viewContainer: {
          //           height: 50,
          //           justifyContent: "center",
          //           paddingHorizontal: 15
          //         },
          //         placeholder: {
          //           color: "#5c5c5c"
          //         },
          //       }}
          //     />
          // )
        }
      </View>
    </View >
  );
};
