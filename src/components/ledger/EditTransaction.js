import { useCallback, useEffect, useState } from 'react';

import {
    Avatar,
    Button,
    ClickAwayListener,
    Collapse,
    Divider,
    FormControl,
    Icon,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material';

import { Add, Check, Delete, KeyboardDoubleArrowRight } from '@mui/icons-material';

import { LoadingButton } from '@mui/lab';
import { DateTimePicker } from '@mui/x-date-pickers';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import useLedger from '@/contexts/LedgerContext';

import useRequest from '@/hooks/useRequest';

import Drawer from '../util/Drawer';
import PersonItem from './PersonItem';
import SharedItem from './SharedItem';
import TransactionSection from './TransactionSection';

dayjs.extend(utc);

export default function EditTransaction({ isNew, editData, people, group, occasions, open, onClose }) {
    const theme = useTheme();
    const request = useRequest();

    const { getPersonFromId } = useLedger();

    const [saving, setSaving] = useState(false);
    const [confirmationOpen, setConfirmationOpen] = useState(false);

    const [total, setTotal] = useState(0);
    const [subtotal, setSubtotal] = useState(0);

    const [individualAmounts, setIndividualAmounts] = useState({});
    const [sharedAmounts, setSharedAmounts] = useState([]);
    const [reason, setReason] = useState('');
    const [userPaying, setUserPaying] = useState('');

    const [date, setDate] = useState(dayjs().utc().local());
    const [occasion, setOccasion] = useState('None');
    const [tax, setTax] = useState('');
    const [tip, setTip] = useState('');

    const [tipPreview, setTipPreview] = useState('');
    const [tipPercent, setTipPercent] = useState('15');
    const [showTipCalculator, setShowTipCalculator] = useState(false);

    const [currentOccasion, setCurrentOccasion] = useState(null);
    const [currentPeople, setCurrentPeople] = useState([]);

    function submit() {
        setSaving(true);

        let amountsFinal = individualAmounts;
        let sharedFinal = sharedAmounts;
        //delete the empty item in each person's array
        Object.keys(amountsFinal).forEach((personId) => {
            amountsFinal[personId] = amountsFinal[personId].filter((amount) => amount !== '');
            amountsFinal[personId].forEach((amount, index) => {
                amountsFinal[personId][index] = parseFloat(amount).toFixed(2);
            });
        });
        //delete the empty item in each shared array
        sharedFinal = sharedFinal.filter((item) => item.amount !== '' && item.people.length !== 0);
        sharedFinal.forEach((item, index) => {
            sharedFinal[index].amount = parseFloat(item.amount).toFixed(2);
        });

        let data = {
            reason: reason,
            date: date.utc(),
            payer: userPaying,
            occasion: occasion,
            group: group._id,
            tax: tax,
            tip: tip,
            individual_items: amountsFinal,
            shared_items: sharedFinal,
            total: total.toFixed(2)
        };

        console.log(data);

        if (isNew) {
            request('/api/ledger/createTransaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
                .then((data) => {
                    close();
                })
                .catch((err) => {});
        } else {
            request(`/api/ledger/${editData._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...data
                })
            })
                .then((data) => {
                    close();
                })
                .catch((err) => {});
        }
    }

    function deleteTransaction() {
        console.log('deleting');
        request(`/api/ledger/${editData._id}`, {
            method: 'DELETE'
        })
            .then((data) => {
                close();
            })
            .catch((err) => {});
    }

    useEffect(() => {
        // add up all individualAmounts
        let newTotal = 0;

        if (individualAmounts) {
            if (Object.keys(individualAmounts).length > 0) {
                let subtotal = 0;
                Object.keys(individualAmounts).forEach((personId) => {
                    individualAmounts[personId].forEach((amount) => {
                        if (amount !== '') {
                            subtotal += parseFloat(amount);
                        }
                    });
                });

                newTotal += subtotal;
            }
        }

        if (sharedAmounts) {
            if (sharedAmounts.length > 0) {
                let subtotal = 0;
                sharedAmounts.forEach((item) => {
                    if (item.amount !== '') {
                        subtotal += parseFloat(item.amount);
                    }
                });

                newTotal += subtotal;
            }
        }

        setSubtotal(newTotal);
    }, [individualAmounts, sharedAmounts]);

    useEffect(() => {
        let total = subtotal;

        if (tax !== '') {
            total += parseFloat(tax);
        }
        if (tip !== '') {
            total += parseFloat(tip);
        }

        setTotal(total);
    }, [tax, tip, subtotal]);

    const presetValues = useCallback(
        (occasion, unfixedIndividualAmounts, unfixedSharedAmounts) => {
            var occasionFromId = occasions && occasions.find((o) => o._id == occasion);
            var peopleForOccasion = [];
            var peopleUnformattedForOccasion = [];

            if (occasionFromId) {
                peopleUnformattedForOccasion = occasionFromId.included_people;
            } else {
                for (const index in people) {
                    let peopleInfo = people[index];
                    peopleUnformattedForOccasion.push(peopleInfo._id);
                }
            }

            // Format personal info from table of users
            for (const index in peopleUnformattedForOccasion) {
                let personId = peopleUnformattedForOccasion[index];
                let personInfo = getPersonFromId(personId);

                if (personInfo) {
                    peopleForOccasion.push(personInfo);
                }
            }

            var newIndividualAmounts = {};
            var newSharedAmounts = [];

            if (peopleForOccasion.length !== 0) {
                // make sure everyone in individualAmounts is actually in the occasion
                if (peopleForOccasion !== null) {
                    peopleForOccasion.forEach((person) => {
                        newIndividualAmounts[person._id] = [''];
                    });

                    if (unfixedIndividualAmounts) {
                        for (const personId of Object.keys(unfixedIndividualAmounts)) {
                            let targetPerson = peopleForOccasion.find((user) => user._id === personId);
                            if (targetPerson) {
                                newIndividualAmounts[personId] = unfixedIndividualAmounts[personId];
                            }
                        }
                    }

                    if (unfixedSharedAmounts) {
                        for (const item of unfixedSharedAmounts) {
                            let newSharedItem = {
                                people: [],
                                amount: ''
                            };
                            for (const personId of item.people) {
                                let targetPerson = peopleForOccasion.find((user) => user._id === personId);
                                if (targetPerson) {
                                    newSharedItem.people.push(personId);
                                }
                            }
                            newSharedItem.amount = item.amount;
                            newSharedAmounts.push(newSharedItem);
                        }
                    } else {
                        newSharedAmounts = [
                            {
                                people: [],
                                amount: ''
                            }
                        ];
                    }
                }
            }

            setOccasion(occasion);
            setIndividualAmounts(newIndividualAmounts);
            setSharedAmounts(newSharedAmounts);
            setCurrentOccasion(occasionFromId);
            setCurrentPeople(peopleForOccasion);
        },
        [occasions, people, getPersonFromId]
    );

    useEffect(() => {
        if (sharedAmounts.length > 0) {
            if (sharedAmounts.every((item) => item.amount !== '' && item.people.length !== 0)) {
                console.log('extending');
                setSharedAmounts((old) => [...old, { people: [], amount: '' }]);
            }

            if (sharedAmounts.some((item) => item.amount === '' && item.people.length === 0)) {
                const emptyIndex = sharedAmounts.findIndex((item) => item.amount === '' && item.people.length === 0);
                if (emptyIndex !== sharedAmounts.length - 1) {
                    console.log('Deleting');
                    console.log(sharedAmounts);
                    setSharedAmounts((old) => [...old.slice(0, emptyIndex), ...old.slice(emptyIndex + 1)]);
                }
            }
        }
    }, [sharedAmounts]);

    useEffect(() => {
        let newTipPreview = subtotal * parseFloat('.' + tipPercent);
        setTipPreview(newTipPreview.toFixed(2));
    }, [tipPercent, subtotal]);

    function close() {
        onClose();
        setReason('');
        setDate(dayjs());
        setTax('');
        setTip('');
        setUserPaying('');
        setTotal(0);
        setSubtotal(0);
        setConfirmationOpen(false);
        setSaving(false);
        setShowTipCalculator(false);

        presetValues('None');
    }

    useEffect(() => {
        presetValues('None');
    }, [presetValues]);

    useEffect(() => {
        if (editData) {
            console.log(editData);
            setReason(editData.reason);
            setDate(dayjs(editData.date));
            setTax(editData.tax);
            setTip(editData.tip);
            setUserPaying(editData.payer);

            presetValues(editData.occasion, editData.individual_items, editData.shared_items);
        }
    }, [editData, presetValues]);

    return (
        <Drawer
            open={open}
            title={isNew ? 'New Transaction' : 'Edit Transaction'}
            actions={
                !isNew ? (
                    <ClickAwayListener onClickAway={() => setConfirmationOpen(false)}>
                        <Tooltip
                            arrow
                            PopperProps={{
                                disablePortal: true
                            }}
                            onClose={() => setConfirmationOpen(false)}
                            open={confirmationOpen}
                            disableFocusListener
                            disableHoverListener
                            disableTouchListener
                            title="Tap again to delete this transaction"
                        >
                            <IconButton
                                color="secondary"
                                onClick={() => (confirmationOpen ? deleteTransaction() : setConfirmationOpen(true))}
                            >
                                <Delete />
                            </IconButton>
                        </Tooltip>
                    </ClickAwayListener>
                ) : null
            }
        >
            <TransactionSection
                title="Metadata"
                open
            >
                <Stack
                    direction="column"
                    width="100%"
                    gap={2}
                    mt={1}
                >
                    <Stack
                        direction="row"
                        gap={1}
                    >
                        <TextField
                            label="Description"
                            variant="outlined"
                            size="medium"
                            fullWidth
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            sx={{ flexBasis: '50%' }}
                        />

                        <FormControl sx={{ flexBasis: '50%' }}>
                            <InputLabel id="payer-label">Payer</InputLabel>
                            <Select
                                variant="outlined"
                                size="medium"
                                label="Buyer"
                                value={userPaying}
                                onChange={(selectionEntry) => {
                                    console.log(selectionEntry.target.value);
                                    setUserPaying(selectionEntry.target.value);
                                }}
                                renderValue={(selected) => {
                                    let person = getPersonFromId(selected);
                                    return (
                                        <Stack
                                            direction="row"
                                            justifyContent="flex-start"
                                            width="100%"
                                            alignItems="center"
                                            gap={1}
                                        >
                                            {person ? (
                                                <>
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: `${person._id.toLowerCase()}.main`,
                                                            width: 18,
                                                            height: 18
                                                        }}
                                                        key={selected}
                                                    >
                                                        <Icon />
                                                    </Avatar>
                                                    <Typography variant="body1">{person.name}</Typography>
                                                </>
                                            ) : null}
                                        </Stack>
                                    );
                                }}
                            >
                                {currentPeople.map((person) => {
                                    return (
                                        <MenuItem
                                            key={person._id}
                                            value={person._id}
                                            sx={{ gap: '5px' }}
                                        >
                                            <Avatar
                                                sx={{
                                                    bgcolor: `${person._id.toLowerCase()}.main`,
                                                    width: 20,
                                                    height: 20
                                                }}
                                            >
                                                <Icon />
                                            </Avatar>
                                            {person.name}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Stack>

                    <Stack
                        direction="row"
                        gap={1}
                    >
                        <DateTimePicker
                            slotProps={{ textField: { size: 'medium' } }}
                            label="Time"
                            value={date}
                            onChange={(v) => {
                                setDate(v);
                            }}
                            sx={{ flexBasis: '50%' }}
                        />

                        <FormControl sx={{ flexBasis: '50%' }}>
                            <InputLabel id="transaction-type-label">Occasion</InputLabel>
                            <Select
                                variant="outlined"
                                size="medium"
                                label="Occasion"
                                value={occasion}
                                onChange={(selectionEntry) => {
                                    var selectionValue = selectionEntry.target.value;
                                    presetValues(selectionValue, individualAmounts, sharedAmounts);
                                }}
                            >
                                <MenuItem
                                    key="None"
                                    value="None"
                                >
                                    None
                                </MenuItem>
                                {editData ? (
                                    editData.occasion !== 'None' ? (
                                        <MenuItem
                                            key={editData.occasion}
                                            value={editData.occasion}
                                        >
                                            {occasions.find((o) => o._id === editData.occasion).name} (inactive)
                                        </MenuItem>
                                    ) : null
                                ) : null}
                                {occasions &&
                                    occasions.map((occasion) => {
                                        if (occasion.timeState === 'active') {
                                            return (
                                                <MenuItem
                                                    key={occasion._id}
                                                    value={occasion._id}
                                                >
                                                    {occasion.name}
                                                </MenuItem>
                                            );
                                        } else {
                                            return null;
                                        }
                                    })}
                            </Select>
                        </FormControl>
                    </Stack>
                </Stack>
            </TransactionSection>

            <TransactionSection title="Individual items">
                <Stack
                    direction="column"
                    gap={2}
                    mt={1}
                    width="100%"
                >
                    {individualAmounts
                        ? currentPeople.map((personInfo) => {
                              return (
                                  <PersonItem
                                      key={personInfo._id}
                                      personId={personInfo._id}
                                      name={personInfo.name}
                                      individualAmounts={individualAmounts}
                                      setIndividualAmounts={setIndividualAmounts}
                                  />
                              );
                          })
                        : null}
                </Stack>
            </TransactionSection>

            <TransactionSection title="Shared items">
                <Stack
                    direction="column"
                    gap={2}
                    mt={1}
                    width="100%"
                >
                    {sharedAmounts && sharedAmounts.length > 0
                        ? sharedAmounts.map((sharedItem, index) => {
                              return (
                                  <SharedItem
                                      key={index}
                                      index={index}
                                      people={currentPeople}
                                      sharedItem={sharedItem}
                                      sharedAmounts={sharedAmounts}
                                      setSharedAmounts={setSharedAmounts}
                                  />
                              );
                          })
                        : null}
                </Stack>
            </TransactionSection>

            <Stack
                width="100%"
                direction="column"
                gap={1}
                mt={1}
            >
                <Stack
                    width="100%"
                    direction="row"
                    gap={1}
                    justifyContent="center"
                    alignItems="center"
                >
                    <Stack
                        width="100%"
                        direction="row"
                        flexBasis="40%"
                        justifyContent="center"
                        alignItems="center"
                    >
                        {/* <Button variant="text" sx={{ textTransform: "none" }} color="primaryText"> */}
                        <Typography
                            variant="h6"
                            sx={{ flexBasis: '40%', textAlign: 'center' }}
                        >
                            Tax
                        </Typography>
                        {/* </Button> */}
                    </Stack>
                    <Add />
                    <TextField
                        variant="outlined"
                        size="small"
                        type="number"
                        InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>
                        }}
                        sx={{ flexBasis: '60%' }}
                        value={tax}
                        onChange={(e) => {
                            setTax(e.target.value);
                        }}
                    />
                </Stack>

                <Stack
                    direction="column"
                    width="100%"
                >
                    <Stack
                        direction="row"
                        gap={1}
                        alignSelf="flex-end"
                        justifyContent="center"
                        alignItems="center"
                        width="100%"
                    >
                        <Stack
                            direction="row"
                            flexBasis="40%"
                            justifyContent="center"
                            alignItems="center"
                        >
                            <Button
                                variant="text"
                                sx={{ textTransform: 'none' }}
                                color="primaryText"
                                onClick={() => setShowTipCalculator((a) => !a)}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{ flexBasis: '40%', textAlign: 'center' }}
                                >
                                    Tip
                                </Typography>
                            </Button>
                        </Stack>
                        <Add />
                        <TextField
                            variant="outlined"
                            size="small"
                            type="number"
                            value={tip}
                            onChange={(e) => {
                                setTip(e.target.value);
                            }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>
                            }}
                            sx={{ flexBasis: '60%' }}
                        />
                    </Stack>
                    <Collapse
                        in={showTipCalculator}
                        sx={{ width: '100%' }}
                    >
                        <Stack
                            direction="row"
                            mt={2}
                            justifyContent="center"
                            alignItems="center"
                        >
                            <ToggleButtonGroup
                                exclusive
                                size="medium"
                                onChange={(e, newTip) => {
                                    if (newTip) {
                                        setTipPercent(newTip);
                                    }
                                }}
                                value={tipPercent}
                                sx={{
                                    width: 'auto',
                                    flexBasis: '55%',
                                    justifyContent: 'center'
                                }}
                            >
                                <ToggleButton
                                    value="15"
                                    color="primary"
                                >
                                    15%
                                </ToggleButton>
                                <ToggleButton
                                    value="18"
                                    color="primary"
                                >
                                    18%
                                </ToggleButton>
                                <ToggleButton
                                    value="20"
                                    color="primary"
                                >
                                    20%
                                </ToggleButton>
                            </ToggleButtonGroup>
                            <Typography variant="h5">=</Typography>
                            <Stack
                                direction="row"
                                flexBasis="45%"
                                justifyContent="center"
                                alignItems="center"
                            >
                                <Typography
                                    variant="h6"
                                    sx={{ textAlign: 'center', flexGrow: 1 }}
                                >
                                    ${tipPreview}
                                </Typography>
                                <IconButton
                                    onClick={() => {
                                        setTip(tipPreview);
                                        setShowTipCalculator(false);
                                    }}
                                >
                                    <Check color="primary" />
                                </IconButton>
                            </Stack>
                        </Stack>
                    </Collapse>
                </Stack>
            </Stack>
            {/* </TransactionSection> */}

            <Divider sx={{ width: '60%', alignSelf: 'flex-end' }} />

            <Stack
                direction="row"
                width="100%"
                gap={1}
                alignSelf="flex-end"
                justifyContent="flex-end"
                alignItems="center"
            >
                <Typography
                    variant="h6"
                    sx={{ flexBasis: '40%', textAlign: 'center' }}
                >
                    Total
                </Typography>
                <KeyboardDoubleArrowRight />
                <Typography
                    variant="h5"
                    sx={{ flexBasis: '60%', textAlign: 'left', paddingLeft: '5px' }}
                >
                    ${total.toFixed(2)}
                </Typography>
            </Stack>

            <Stack
                direction="row"
                width="100%"
                justifyContent="space-evenly"
                marginTop={1}
                gap={1}
            >
                <Button
                    variant="outlined"
                    color="secondary"
                    size="large"
                    onClick={close}
                    sx={{ width: '100%' }}
                >
                    Cancel
                </Button>
                <LoadingButton
                    variant="outlined"
                    color="primary"
                    size="large"
                    sx={{ width: '100%' }}
                    onClick={submit}
                    loading={saving}
                    disabled={reason === '' || total === 0 || subtotal === 0 || occasion === '' || userPaying === ''}
                >
                    Save
                </LoadingButton>
            </Stack>
        </Drawer>
    );
}
